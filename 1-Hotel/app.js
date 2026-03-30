const express = require("express");
const multer = require("multer");
const { dynamodbClient, s3Client } = require("./config/aws-config");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
const upload = multer({ storage: multer.memoryStorage() });

const TABLE = "EventTickets"; // TÊN BẢNG MỚI
const BUCKET = "event-tickets-bucket-12"; // Tên bucket S3 của bạn

app.get("/", async (req, res) => {
    const { q, status } = req.query;
    let { Items } = await dynamodbClient.scan({ TableName: TABLE });
    
    // Tìm kiếm theo tên phòng hoặc tên khách
    if (q) {
        Items = Items.filter(t => t.roomName.toLowerCase().includes(q.toLowerCase()) || 
                                  t.customerName.toLowerCase().includes(q.toLowerCase()));
    }
    if (status && status !== "all") {
        Items = Items.filter(t => t.status === status);
    }
    res.render("index", { bookings: Items });
});

app.get("/form", async (req, res) => {
    const { id } = req.query;
    let booking = null;
    if (id) {
        const data = await dynamodbClient.get({ TableName: TABLE, Key: { bookingId: id } });
        booking = data.Item;
    }
    res.render("form", { booking, error: null });
});

app.post("/upsert", upload.single("image"), async (req, res) => {
    try {
        let { bookingId, roomName, customerName, roomType, days, pricePerDay, checkInDate, status, oldImage } = req.body;
        days = Number(days);
        pricePerDay = Number(pricePerDay);

        // --- VALIDATION TÙY BIẾN ---
        if (days <= 0) throw new Error("Số ngày thuê phải > 0");
        if (pricePerDay <= 0) throw new Error("Giá phòng phải > 0");
        if (new Date(checkInDate) < new Date(new Date().toDateString())) throw new Error("Ngày Check-in không hợp lệ");
        if (!["Standard", "Deluxe", "Suite"].includes(roomType)) throw new Error("Loại phòng sai");

        // --- UPLOAD ẢNH ---
        let imageUrl = oldImage || "";
        if (req.file) {
            const key = Date.now() + "-" + req.file.originalname;
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET, Key: key, Body: req.file.buffer, ContentType: req.file.mimetype
            }));
            imageUrl = `https://${BUCKET}.s3.amazonaws.com/${key}`;
        }

        // --- NGHIỆP VỤ TÍNH TIỀN & GIẢM GIÁ ---
        const totalAmount = days * pricePerDay;
        let finalAmount = totalAmount;

        if (roomType === "Suite" && days >= 3) finalAmount *= 0.85;       // Giảm 15%
        else if (roomType === "Deluxe" && days >= 5) finalAmount *= 0.90; // Giảm 10%

        const discount = finalAmount < totalAmount ? "Được giảm giá" : "Không giảm giá";

        // --- LƯU DATABASE ---
        const item = {
            bookingId: bookingId || Date.now().toString(),
            roomName, customerName, roomType, days, pricePerDay, checkInDate, status, 
            imageUrl, totalAmount, finalAmount, discount
        };

        await dynamodbClient.put({ TableName: TABLE, Item: item });
        res.redirect("/");
    } catch (err) {
        res.render("form", { booking: req.body, error: err.message });
    }
});

app.post("/delete/:id", async (req, res) => {
    await dynamodbClient.delete({ TableName: TABLE, Key: { bookingId: req.params.id } });
    res.redirect("/");
});

app.listen(3000, () => console.log("Server on port 3000"));