// === Importations ===
import express from "express";
import {
  Client,
  GatewayIntentBits,
  Routes,
  REST,
  SlashCommandBuilder,
} from "discord.js";
import "dotenv/config";

// === Initialisation du bot ===
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// === Commandes ===
const commands = [
  new SlashCommandBuilder()
    .setName("écrire")
    .setDescription(
      "Envoie un message anonyme avec ou sans texte, et jusqu’à 6 images."
    )
    .addStringOption((option) =>
      option
        .setName("texte")
        .setDescription("Le message à envoyer")
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option.setName("image1").setDescription("Image 1")
    )
    .addAttachmentOption((option) =>
      option.setName("image2").setDescription("Image 2")
    )
    .addAttachmentOption((option) =>
      option.setName("image3").setDescription("Image 3")
    )
    .addAttachmentOption((option) =>
      option.setName("image4").setDescription("Image 4")
    )
    .addAttachmentOption((option) =>
      option.setName("image5").setDescription("Image 5")
    )
    .addAttachmentOption((option) =>
      option.setName("image6").setDescription("Image 6")
    ),
].map((cmd) => cmd.toJSON());

// === Gestion des interactions ===
client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "écrire") return;

    const texte = interaction.options.getString("texte");
    const images = [];

    // Récupère jusqu’à 6 images
    for (let i = 1; i <= 6; i++) {
      const img = interaction.options.getAttachment(`image${i}`);
      if (img) images.push(img);
    }

    // Si aucun texte ni image → avertissement
    if (!texte && images.length === 0) {
      await interaction.reply({
        content: "⚠️ Tu dois fournir un texte ou au moins une image.",
        ephemeral: true,
      });
      return;
    }

    // Création du message à envoyer publiquement
    const messagePayload = {};
    if (texte) messagePayload.content = texte;
    if (images.length > 0) messagePayload.files = images;

    // Envoie public
    await interaction.channel.send(messagePayload);

    // Réponse privée de confirmation
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "✅ Message envoyé anonymement.",
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("❌ Erreur pendant l'interaction :", error);
    if (interaction && !interaction.replied) {
      try {
        await interaction.reply({
          content: "⚠️ Une erreur est survenue, réessaie plus tard.",
          ephemeral: true,
        });
      } catch (err) {
        console.error("Erreur lors de l’envoi du message d’erreur :", err);
      }
    }
  }
});

// === Déploiement automatique des commandes ===
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🚀 Déploiement des commandes slash...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("✅ Commandes déployées avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors du déploiement des commandes :", error);
  }
})();

// === Connexion du bot ===
client.login(process.env.TOKEN);

// === Gestion des erreurs globales ===
process.on("unhandledRejection", (reason) => {
  console.log("⚠️ Rejet non géré :", reason);
});
process.on("uncaughtException", (err) => {
  console.error("💥 Erreur non capturée :", err);
});

// === Serveur Express pour Render (évite le time-out) ===
const app = express();
app.get("/", (req, res) => res.send("Bot TopIdiom en ligne 🟢"));
app.listen(3000, () =>
  console.log("🌐 Serveur keep-alive pour Render démarré sur le port 3000.")
);
