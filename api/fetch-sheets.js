export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWx1yKXc-rzoN8vqYa1SEyc_ffe0bmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIRP841n/pub?gid=0&single=true&output=csv";

  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) {
      throw new Error("Gagal mengambil CSV dari Google Sheets");
    }
    const data = await response.text();
    res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
