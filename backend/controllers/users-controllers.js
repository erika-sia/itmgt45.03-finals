const { v7: uuid } = require("uuid");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again later.",
      500
    );
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const { name, firstName, lastName, mobileNumber, email, password, places } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead.",
      422
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    firstName,
    lastName,
    mobileNumber,
    email,
    image:
      "https://img.freepik.com/free-vector/user-circles-set_78370-4704.jpg?semt=ais_incoming&w=740&q=80",
    password,
    places,
  });

  try {
    await createdUser.save();
  } catch (err) {
    console.error("--- SIGNUP FAILED ---", err);

    const error = new HttpError("Signing up failed, please try again.", 500);
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  console.log("Login attempt for email:", email);
  console.log("Request body received:", req.body);

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
    console.log("User query result:", existingUser);
  } catch (err) {
    console.error("Database query error:", err);
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!existingUser || existingUser.password !== password) {
    console.log("Login failed - existingUser:", existingUser ? "found" : "not found");
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }

  console.log("Login successful for user:", existingUser.id);
  res.json({
    message: "Logged in!",
    userId: existingUser.id,
    email: existingUser.email,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
