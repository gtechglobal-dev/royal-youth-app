router.post("/login", async (req, res) => {
  const { phone, password } = req.body;

  const member = await Member.findOne({ phone });

  if (!member) {
    return res.status(400).json({
      message: "Member not found",
    });
  }

  if (member.password !== password) {
    return res.status(400).json({
      message: "Invalid password",
    });
  }

  res.json({
    member,
  });
});
