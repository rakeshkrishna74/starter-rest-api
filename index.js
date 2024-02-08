const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const axios = require("axios");
const algorithm = "aes-192-cbc";
const secret = "charan-kosari";
const key = crypto.scryptSync(secret, "salt", 24);
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv(algorithm, key, iv);
const decipher = crypto.createDecipheriv(algorithm, key, iv);

mongoose
  .connect(
    "mongodb+srv://arw:users@users.ktzndit.mongodb.net/?retryWrites=true&w=majority",
  )
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
  });

app.use(express.json());
app.use(cors());

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "arw@augmentedrealitywardrobe.com",
    pass: "Dkdevops#25923",
  },
});

const port = 9999;
const RatingSchema = new mongoose.Schema({
  rate: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});
const RatingModel = mongoose.model("ratings", RatingSchema);

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  imageUrl: [
    {
      type: String,
      required: false,
    },
  ],
  videoUrl: [
    {
      type: String,
      required: false,
    },
  ],
  LicenseAndAgreement: {
    type: Boolean,
    required: true,
  },
  orderStatus: [
    {
      type: String,
    },
  ],
  colour: [
    {
      type: String,
      required: true,
    },
  ],
  size: [
    {
      type: String,
      required: true,
    },
  ],
});

const UserModel = mongoose.model("users", UserSchema);

app.post("/api/update-order-status", async (req, res) => {
  try {
    const { email, orderIndex, newOrderStatus } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (orderIndex < 0 || orderIndex >= user.orderStatus.length) {
      return res.status(400).json({ message: "Invalid order index" });
    }
    user.orderStatus[orderIndex] = newOrderStatus;

    await user.save();

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.post("/address", async (req, res) => {
  try {
    const { email, raww } = req.body;
    const headers = {
      "Content-Type": "application/json",
      Authorization:
        "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwaXYyLnNoaXByb2NrZXQuaW4vdjEvZXh0ZXJuYWwvYXV0aC9sb2dpbiIsImlhdCI6MTcwNzM3MjY1MCwiZXhwIjoxNzA4MjM2NjUwLCJuYmYiOjE3MDczNzI2NTAsImp0aSI6IjlKQWF4cVBPaGZMaUIzaGwiLCJzdWIiOjQxNDEzOTUsInBydiI6IjA1YmI2NjBmNjdjYWM3NDVmN2IzZGExZWVmMTk3MTk1YTIxMWU2ZDkifQ.f2TRWx9jvv6Ej8tPi0AQNGq-0ahRUABmfhqLDgs7Bl0",
    };

    const shiprocketResponse = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      raww,
      {
        headers: headers,
      },
    );

    const order = shiprocketResponse.data.order_id;

    try {
      const header = {
        "Content-Type": "application/json",
        Authorization:
          "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwaXYyLnNoaXByb2NrZXQuaW4vdjEvZXh0ZXJuYWwvYXV0aC9sb2dpbiIsImlhdCI6MTcwNzM3MjY1MCwiZXhwIjoxNzA4MjM2NjUwLCJuYmYiOjE3MDczNzI2NTAsImp0aSI6IjlKQWF4cVBPaGZMaUIzaGwiLCJzdWIiOjQxNDEzOTUsInBydiI6IjA1YmI2NjBmNjdjYWM3NDVmN2IzZGExZWVmMTk3MTk1YTIxMWU2ZDkifQ.f2TRWx9jvv6Ej8tPi0AQNGq-0ahRUABmfhqLDgs7Bl0",
      };
      const response = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/orders/print/invoice",
        { ids: [order] },
        { headers: header },
      );

      const ok = await response.data;
      const invoice = ok.invoice_url;

      try {
        const { email, raww } = req.body;

        const mailOptions = {
          from: "arw@augmentedrealitywardrobe.com",
          to: email,
          subject: "Order placed successfully",
          text: `The invoice for your order is ${invoice}  `,
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Invoice  sent successfully" });
      } catch (error) {
        console.error("error while sending email");
      }
    } catch (error) {
      console.error("Error while getting invoice", error);
    }
  } catch (error) {
    console.error("Error while posting:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/user-details", async (req, res) => {
  try {
    const users = await UserModel.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while retrieving users" });
  }
});

app.post("/api/cosi", async (req, res) => {
  try {
    const { email, colour, size } = req.body;
    console.log(size);
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.colour[0] == "" || user.colour[0] === null) {
      user.colour[0] = colour;
      user.size[0] = size;
    } else {
      user.colour = user.colour.concat(colour);
      user.size = user.size.concat(size);
    }
    await user.save();

    res.status(200).json({ message: "Colour and size updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/user-detail", async (req, res) => {
  const { email } = req.query;

  try {
    const user = await UserModel.findOne({ email });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while retrieving user details" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const users = await UserModel.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while retrieving users" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { emaill, password } = req.body;
    const decryptedEmail =
      decipher.update(emaill, "hex", "utf8") + decipher.final("utf8");
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.findOne({ email: decryptedEmail });
    console.log(decryptedEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/update-license-agreement", async (req, res) => {
  const { email, LicenseAndAgreement } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.LicenseAndAgreement = LicenseAndAgreement;
    await user.save();
    return res
      .status(200)
      .json({ message: "License and Agreement updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/change-password", async (req, res) => {
  try {
    const { emaill, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.findOne({ email: emaill });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/send-reset-link", async (req, res) => {
  try {
    const { email } = req.body;
    var encrypted = cipher.update(email, "utf8", "hex") + cipher.final("hex");
    const mailOptions = {
      from: "arw@augmentedrealitywardrobe.com",
      to: email,
      subject: "Password Reset",
      text: `Click the following link to reset your password: https://augmentedrealitywardrobe.com/#/forgot-password?email=${encrypted}`,
    };
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Password reset link sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending email" });
  }
});

app.post("/api/upload-image", async (req, res) => {
  try {
    const { email, imageUrl } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else {
      if (user.imageUrl[0] == "" || null) {
        user.imageUrl[0] = imageUrl;
        user.orderStatus[0] = "pending";
      } else {
        user.imageUrl = user.imageUrl.concat(imageUrl);
        user.orderStatus = user.orderStatus.concat("pending");
      }
    }
    await user.save();

    res
      .status(200)
      .json({ message: "Image URL and Order Status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/upload-video", async (req, res) => {
  try {
    const { email, videoUrl } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.videoUrl[0] == "" || null) {
      user.videoUrl[0] = videoUrl;
    } else {
      user.videoUrl = user.videoUrl.concat(videoUrl);
    }

    await user.save();
    res.status(200).json({ message: "Video URL updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/register", async (req, res) => {
  const user = req.body;
  const existingUser = await UserModel.findOne({ email: user.email });
  if (existingUser) {
    res.status(409).json({ message: "Email already exists" });
  } else {
    const newUser = new UserModel({
      ...user,
      color: [],
      size: [],
    });
    await newUser.save();
    res.json(newUser);
  }
});

app.post("/api/rate", async (req, res) => {
  const { rate, name, description } = req.body;

  try {
    const newReview = new RatingModel({
      rate,
      name,
      description,
    });
    await newReview.save();
    res.status(201).json({ message: "Review created successfully" });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
app.get("/api/all-ratings", async (req, res) => {
  try {
    const ratings = await RatingModel.find({}, { _id: 0, __v: 0 });
    res.json(ratings);
  } catch (error) {
    console.error("Error getting all ratings:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
