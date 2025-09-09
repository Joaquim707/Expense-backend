const Expense = require('../models/Expense');
const asyncHandler = require('../middleware/asyncHandler');
const Joi = require('joi');

// validation schema
const expenseSchema = Joi.object({
  title: Joi.string().min(1).required(),
  amount: Joi.number().min(0).required(),
  category: Joi.string().optional(),
  date: Joi.date().optional(),
  notes: Joi.string().allow('', null)
});

// Create expense
exports.createExpense = asyncHandler(async (req, res) => {
  const { error, value } = expenseSchema.validate(req.body);
  if (error) {
    const err = new Error('Validation Error');
    err.statusCode = 400;
    err.details = error.details;
    throw err;
  }
  const expense = await Expense.create(value);
  res.status(201).json({ success: true, data: expense });
});

// Get all expenses with pagination & optional filter
exports.getExpenses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, startDate, endDate, sort = '-date' } = req.query;
  const query = {};
  if (category) query.category = category;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Expense.countDocuments(query);
  const expenses = await Expense.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: expenses,
    meta: { total, page: parseInt(page), limit: parseInt(limit) }
  });
});

// Get single expense
exports.getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    const err = new Error('Expense not found');
    err.statusCode = 404;
    throw err;
  }
  res.json({ success: true, data: expense });
});

// Update expense
exports.updateExpense = asyncHandler(async (req, res) => {
  const { error, value } = expenseSchema.validate(req.body);
  if (error) {
    const err = new Error('Validation Error');
    err.statusCode = 400;
    err.details = error.details;
    throw err;
  }

  const expense = await Expense.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
  if (!expense) {
    const err = new Error('Expense not found');
    err.statusCode = 404;
    throw err;
  }
  res.json({ success: true, data: expense });
});

// Delete expense
exports.deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) {
    const err = new Error('Expense not found');
    err.statusCode = 404;
    throw err;
  }
  res.json({ success: true, message: 'Expense deleted' });
});
