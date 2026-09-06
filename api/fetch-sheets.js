export default async function handler(req, res) {
  // Set header agar tidak kena CORS di browser
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Link CSV Google Sheets
  const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWx1yKXc-rzoN8vqYa1SEyc_ffe0bmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=586995800&single=true&output=csv";

  try {
    const response = await fetch(sheetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    if (!response.ok) {
      throw new Error(`Google responded with status: ${response.status}`);
    }

    const data = await response.text();
    res.setHeader("Content-Type", "text/csv");
    return res.status(200).send(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
