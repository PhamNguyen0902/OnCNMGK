const express = require("express");
const multer = require("multer");
const { dynamodbClient, s3Client } = require("./config/aws-config");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
const upload = multer({ storage: multer.memoryStorage() });

const TABLE = "EventTickets"; // Bảng mới
const BUCKET = "event-tickets-bucket-12"; // Tên bucket của bạn

// ================= RENDER DANH SÁCH =================
app.get("/", async (req, res) => {
    const { q, status } = req.query;
    let { Items } = await dynamodbClient.scan({ TableName: TABLE });
    
    // Tìm kiếm theo tên khóa học hoặc tên học viên
    if (q) {
        Items = Items.filter(c => c.courseName.toLowerCase().includes(q.toLowerCase()) || 
                                  c.studentName.toLowerCase().includes(q.toLowerCase()));
    }
    if (status && status !== "all") {
        Items = Items.filter(c => c.status === status);
    }
    res.render("index", { courses: Items });
});

// ================= RENDER FORM =================
app.get("/form", async (req, res) => {
    const { id } = req.query;
    let course = null;
    if (id) {
        const data = await dynamodbClient.get({ TableName: TABLE, Key: { courseId: id } });
        course = data.Item;
    }
    res.render("form", { course, error: null });
});

// ================= XỬ LÝ LƯU & TÍNH TIỀN =================
app.post("/upsert", upload.single("image"), async (req, res) => {
    try {
        let { courseId, courseName, studentName, level, duration, feePerMonth, startDate, status, oldImage } = req.body;
        duration = Number(duration);
        feePerMonth = Number(feePerMonth);

        // --- VALIDATION TÙY BIẾN ---
        if (duration <= 0) throw new Error("Thời gian học phải lớn hơn 0 tháng");
        if (feePerMonth <= 0) throw new Error("Học phí mỗi tháng phải > 0");
        if (new Date(startDate) < new Date(new Date().toDateString())) throw new Error("Ngày khai giảng không được trong quá khứ");
        if (!["Beginner", "Intermediate", "Advanced"].includes(level)) throw new Error("Cấp độ không hợp lệ");

        // --- UPLOAD ẢNH (Banner khóa học) ---
        let imageUrl = oldImage || "";
        if (req.file) {
            const key = Date.now() + "-" + req.file.originalname;
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET, Key: key, Body: req.file.buffer, ContentType: req.file.mimetype
            }));
            imageUrl = `https://${BUCKET}.s3.amazonaws.com/${key}`;
        }

        // --- NGHIỆP VỤ TÍNH TIỀN ---
        const totalTuition = duration * feePerMonth; // Tổng học phí
        let finalTuition = totalTuition;

        // Xử lý giảm giá
        if (level === "Advanced" && duration >= 6) {
            finalTuition *= 0.85; // Giảm 15%
        } else if (level === "Intermediate" && duration >= 3) {
            finalTuition *= 0.90; // Giảm 10%
        }

        const discount = finalTuition < totalTuition ? "Được giảm giá học phí" : "Không giảm giá";

        // --- LƯU DATABASE ---
        const item = {
            courseId: courseId || Date.now().toString(),
            courseName, studentName, level, duration, feePerMonth, startDate, status, 
            imageUrl, totalTuition, finalTuition, discount
        };

        await dynamodbClient.put({ TableName: TABLE, Item: item });
        res.redirect("/");
    } catch (err) {
        res.render("form", { course: req.body, error: err.message });
    }
});

// ================= XÓA KHÓA HỌC =================
app.post("/delete/:id", async (req, res) => {
    await dynamodbClient.delete({ TableName: TABLE, Key: { courseId: req.params.id } });
    res.redirect("/");
});

app.listen(3000, () => console.log("Server on port 3000"));