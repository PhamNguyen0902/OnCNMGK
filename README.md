Giải thích thuộc tính PK : 
(Câu 1): "Chọn ticketId làm Khóa chính (Partition Key) vì mỗi vé phát hành ra là duy nhất, không trùng lặp, giúp truy xuất 1 vé cụ thể nhanh chóng với độ phức tạp O(1)." 
Luồng dữ liệu (Câu 1): "Client nhập form -> Server nhận file, dùng thư viện AWS SDK upload file buffer lên S3 (PutObjectCommand) lấy URL -> Server tính toán nghiệp vụ (giá tiền, giảm giá) -> Cuối cùng đóng gói URL ảnh và Data thành JSON lưu vào DynamoDB (PutCommand)." Giải thích logic 
(Câu 3): "Em xử lý Validation bằng các lệnh if, nếu sai ném ra lỗi throw new Error(), bắt tại catch và hiển thị ra UI. Logic giảm giá em dùng if-else kiểm tra category và quantity, lấy quantity * price nhân với hệ số 0.9 (giảm 10%) hoặc 0.85 (giảm 15%) để ra finalAmount." 
