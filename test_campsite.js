const fetch = require('node-fetch'); // or global fetch if Node 18+

async function testCreate() {
  try {
    const res = await fetch("https://outpost-app.onrender.com/api/campsites", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // We'll omit Authorization since the API requires it, but let's see what happens if we provide a dummy token or no token.
        // Wait, if we provide no token, it gives 401. If we provide a token, we need a valid one.
      },
      body: JSON.stringify({
        id: "camp_123",
        name: "Test Camp",
        description: "Test description",
        category: "Casual",
        icon: "🏕️",
        totalScouts: 1,
        activeScouts: 1,
        color: "#ffcc00",
        adminEmail: "harshitmehta1012@gmail.com",
        adminUsername: "harshitmehta1012",
        isPublic: true,
        template: "casual",
        imageUrl: "",
        members: ["harshitmehta1012"],
        expeditions: []
      })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (e) {
    console.error(e);
  }
}
testCreate();
