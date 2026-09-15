require("dotenv").config();

const express = require("express");
const cors = require("cors");

const vehiclesRoutes = require("./routes/vehicles");
const assicurazioniRoutes = require("./routes/assicurazioni");
const bolliRoutes = require("./routes/bolli");
const revisioniRoutes = require("./routes/revisioni");
const tagliandiRoutes = require("./routes/tagliandi");
const dashboardRoutes = require("./routes/dashboard");
const impostazioniEmailRoutes = require("./routes/impostazioniEmail");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use("/api/vehicles", vehiclesRoutes);
app.use("/api/assicurazioni", assicurazioniRoutes);
app.use("/api/bolli", bolliRoutes);
app.use("/api/revisioni", revisioniRoutes);
app.use("/api/tagliandi", tagliandiRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use("/api/impostazioniEmail", impostazioniEmailRoutes);

vehiclesRoutes.registerLegacyAliases(app);

app.listen(3001, () => {
    console.log("Server avviato su http://localhost:3001");
});
