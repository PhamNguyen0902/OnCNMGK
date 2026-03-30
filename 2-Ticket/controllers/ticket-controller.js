const {
  getAllTickets,
  getTicketById,
  upsertTicket,
  deleteTicketById,
} = require("../services/ticket-service");

const handleRenderIndex = async (req, res) => {
  const { nameQuery, statusQuery } = req.query;
  const data = await getAllTickets(nameQuery, statusQuery);
  res.render("index", { tickets: data });
};

const handleRenderForm = async (req, res) => {
  const { ticketId } = req.params;
  const data = ticketId ? await getTicketById(ticketId) : null;
  res.render("form", { ticket: data });
};

const handleUpsertTicket = async (req, res) => {
  const { ticketId } = req.params;
  try {
    await upsertTicket(ticketId, req.body, req.file);
    res.redirect("/");
  } catch (err) {
    res.render("form", {
      ticket: { ticketId, ...req.body },
      error: err.message,
    });
  }
};

const handleDeleteTicketById = async (req, res) => {
  const { ticketId } = req.params;
  try {
    await deleteTicketById(ticketId);
    res.redirect("/");
  } catch (err) {
    res.render("index", {
      error: err.message,
    });
  }
};

module.exports = {
  handleRenderIndex,
  handleRenderForm,
  handleUpsertTicket,
  handleDeleteTicketById,
};
