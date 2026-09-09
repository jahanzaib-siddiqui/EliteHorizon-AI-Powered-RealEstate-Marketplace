const price = undefined;
try {
  console.log(price.toLocaleString());
} catch(e) {
  console.log("Error:", e.message);
}
