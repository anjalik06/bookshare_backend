import { Router } from "express";
import { Book } from "../models/Book";
import { User } from "../models/User";       // ⭐ ADD THIS
import mongoose from "mongoose";
import { upload } from "../middleware/upload";

const router = Router();

// Get all books
router.get("/", async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get books posted by user
router.post("/user", async (req, res) => {
  const { userId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(400).json({ message: "Invalid userId" });

  try {
    const books = await Book.find({ user: userId }).populate("user", "name email");
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get specific book details
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }

  try {
    const book = await Book.findById(id)
      .populate("user", "name email")
      .populate("borrower", "name email");

    if (!book)
      return res.status(404).json({ message: "Book not found" });

    res.json(book);
  } catch (err) {
    console.error("Error fetching book:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Request a book
router.post("/:id/request", async (req, res) => {
  const { id } = req.params;
  const { requesterId } = req.body;
  if (!requesterId)
    return res.status(400).json({ message: "requesterId is required" });

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(requesterId))
    return res.status(400).json({ message: "Invalid ID" });

  try {
    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    if (book.user.toString() === requesterId)
      return res.status(400).json({ message: "Cannot request your own book" });
    if (book.requests?.some(r => r.toString() === requesterId))
      return res.status(400).json({ message: "Already requested" });

    book.requests = book.requests || [];
    book.requests.push(new mongoose.Types.ObjectId(requesterId));
    await book.save();

    res.json({ message: "Request sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all requests for books owned by user
router.get("/requests/user/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(400).json({ message: "Invalid userId" });

  try {
    const books = await Book.find({ user: userId }).populate("requests", "name email");

    const allRequests = books.flatMap(book =>
      (book.requests || []).map(reqUser => ({
        bookId: book._id,
        bookTitle: book.title,
        cover: book.cover,
        requester: reqUser
      }))
    );

    res.json(allRequests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Approve request (⭐ POINTS + SHARE SYSTEM ADDED)
router.post("/:bookId/request/:requesterId/approve", async (req, res) => {
  const { bookId, requesterId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(bookId) || !mongoose.Types.ObjectId.isValid(requesterId))
    return res.status(400).json({ message: "Invalid ID" });

  try {
    const book = await Book.findById(bookId);
    if (!book)
      return res.status(404).json({ message: "Book not found" });

    if (!book.requests?.some(r => r.toString() === requesterId))
      return res.status(400).json({ message: "No such request" });

    // Update book
    book.requests = book.requests.filter(r => r.toString() !== requesterId);
    book.available = false;
    book.borrower = new mongoose.Types.ObjectId(requesterId);
    book.returnDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await book.save();

    // ⭐ INCREASE OWNER'S POINTS + SHARED COUNT
    await User.findByIdAndUpdate(book.user, {
      $inc: { points: 5, booksShared: 1 }
    });

    // ⭐ INCREASE BORROWER'S BORROW COUNT
    await User.findByIdAndUpdate(requesterId, {
      $inc: { booksBorrowed: 1 }
    });

    res.json({ message: "Request approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Reject request
router.post("/:bookId/request/:requesterId/reject", async (req, res) => {
  const { bookId, requesterId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(bookId) || !mongoose.Types.ObjectId.isValid(requesterId))
    return res.status(400).json({ message: "Invalid ID" });

  try {
    const book = await Book.findById(bookId);
    if (!book)
      return res.status(404).json({ message: "Book not found" });

    book.requests = book.requests.filter(r => r.toString() !== requesterId);
    await book.save();

    res.json({ message: "Request rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// On Loan books (owned by user but borrowed)
router.get("/onloan/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(400).json({ message: "Invalid userId" });

  try {
    const books = await Book.find({ user: userId, available: false })
      .populate("borrower", "name email");

    const onLoan = books.map(b => ({
      bookId: b._id,
      bookTitle: b.title,
      cover: b.cover,
      requester: b.borrower,
      returnDate: b.returnDate
    }));

    res.json(onLoan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Borrowed books
router.get("/borrowed/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(400).json({ message: "Invalid userId" });

  try {
    const books = await Book.find({ borrower: userId })
      .populate("user", "name email");

    const borrowed = books.map(b => ({
      bookId: b._id,
      bookTitle: b.title,
      cover: b.cover,
      requester: b.user,
      returnDate: b.returnDate
    }));

    res.json(borrowed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Upload a new book (⭐ UPLOAD POINTS ADDED)
router.post("/upload", upload.single("cover"), async (req, res) => {
  const { title, author, genre, description, userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(400).json({ message: "Invalid userId" });

  try {
    const newBook = new Book({
      title,
      author,
      genre,
      description,
      user: userId,
      available: true,
      cover: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await newBook.save();

    // ⭐ GIVE USER +1 POINT FOR UPLOADING
    await User.findByIdAndUpdate(userId, {
      $inc: { points: 1 }
    });

    res.json({
      message: "Book uploaded successfully",
      book: newBook,
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// DELETE BOOK
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid book ID" });

  try {
    const deleted = await Book.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:bookId/return", async (req, res) => {
  const { bookId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(bookId))
    return res.status(400).json({ message: "Invalid book ID" });

  try {
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (!book.borrower)
      return res.status(400).json({ message: "This book is not currently borrowed" });

    // Reset status
    book.available = true;
    book.borrower = undefined;
    book.returnDate = undefined;
    await book.save();

    res.json({ message: "Book returned successfully" });
  } catch (err) {
    console.error("Return Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
