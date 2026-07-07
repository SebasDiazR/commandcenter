// Temporary: generate a text-based PDF to verify Guided Import PDF extraction. Deleted after use.
const { jsPDF } = require("jspdf");
const fs = require("fs");
const doc = new jsPDF();
const lines = [
  "Prospect Institutions",
  "Riverside Technical College - Riverside TX - Community",
  "Lone Star Maritime Academy - Galveston - Private",
  "Big Bend State College - Alpine TX - Other Public",
];
let y = 20;
for (const l of lines) { doc.text(l, 15, y); y += 12; }
const ab = doc.output("arraybuffer");
fs.writeFileSync("public/__gi_test.pdf", Buffer.from(ab));
console.log("wrote public/__gi_test.pdf", Buffer.from(ab).length, "bytes");
