const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const express = require("express");

const router = express.Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// POST /auth/google
router.post("/google", async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { code } = req.body;

  if (!code)
    return res.status(400).json({ error: "Missing Google auth code" });

  try {
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    if (!GOOGLE_CLIENT_SECRET) {
      console.error("Missing GOOGLE_CLIENT_SECRET in .env");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    const client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      "postmessage"
    );

    const { tokens } = await client.getToken(code);
    const { id_token, refresh_token } = tokens;

    if (!id_token) {
      return res.status(401).json({ error: "Failed to get ID token" });
    }

    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload)
      return res.status(401).json({ error: "Invalid Google token" });

    const { sub: googleId, email, name, picture } = payload;
    if (!googleId || !email)
      return res.status(400).json({ error: "Missing Google user info" });

    // Find or create user
    let user = await prisma.user.findUnique({ where: { googleId } });

    const userData = {
      googleId,
      email_address: email,
      name,
      image: picture,
      verified: true,
    };

    // Only update refresh token if we got a new one
    if (refresh_token) {
      userData.refreshToken = refresh_token;
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          ...userData,
          refreshToken: refresh_token || "",
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: userData,
      });
    }

    // Issue short-lived access token (JWT)
    const sessionToken = jwt.sign(
      { id: user.id, googleId: user.googleId, email: user.email_address },
      JWT_SECRET,
      { expiresIn: "30m" }
    );

    // Set JWT in HTTP-only cookie
    // CRITICAL: Must be sameSite='none' and secure=true for cross-site usage
    res.cookie("sessionToken", sessionToken, {
      httpOnly: true,
      secure: true, // Always secure in production/Vercel
      sameSite: "none", // Required for cross-site cookies
      maxAge: 30 * 60 * 1000, // 30 minutes
      path: '/' // Ensure cookie is valid for all paths
    });

    res.json({
      ok: true,
      user: {
        id: user.id,
        email_address: user.email_address,
        name: user.name,
        image: user.image,
        verified: user.verified,
      },
    });
  } catch (err) {
    console.error("Auth Error:", err);
    res.status(401).json({ error: "Google authentication failed" });
  }
});

// GET /auth/me - Check if user is logged in
router.get("/me", async (req, res) => {
  const prisma = req.app.locals.prisma;
  const token = req.cookies?.sessionToken;

  if (!token) {
    return res.json({ ok: false });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email_address: true,
        name: true,
        image: true,
        verified: true,
      }
    });

    if (!user) {
      return res.json({ ok: false });
    }

    res.json({ ok: true, user });
  } catch (err) {
    res.json({ ok: false });
  }
});

// POST /auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("sessionToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: '/'
  });
  res.json({ ok: true });
});

module.exports = router;