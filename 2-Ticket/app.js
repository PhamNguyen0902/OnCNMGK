const express = require("express");
const multer = require("multer");
const {
  handleRenderIndex,
  handleRenderForm,
  handleUpsertTicket,
  handleDeleteTicketById,
} = require("./controllers/ticket-controller");

const app = express();

app.use(express.urlencoded({ extended: true }));
const upload = multer({ storage: multer.memoryStorage() });

app.set("view engine", "ejs");
app.set("views", "./views");

app.get("/", handleRenderIndex);
app.get("/form", handleRenderForm);
app.get("/form/:ticketId", handleRenderForm);
app.post("/tickets/upsert", upload.single("image"), handleUpsertTicket);
app.post(
  "/tickets/upsert/:ticketId",
  upload.single("image"),
  handleUpsertTicket,
);
app.post("/tickets/delete/:ticketId", handleDeleteTicketById);

app.listen(3000, () => {
  console.log("Server on");
});
