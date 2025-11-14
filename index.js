// index.js — fichier complet et robuste pour TopIdiom

import express from "express";
import {
  Client,
  GatewayIntentBits,
  Routes,
  REST,
  SlashCommandBuilder,
} from "discord.js";
import "dotenv/config";

// === Init bot ===
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// === Commandes (format JSON) ===
const commands = [
  new SlashCommandBuilder()
    .setName("écrire")
    .setDescription("Envoie un message anonyme (texte et/ou jusqu'à 6 images).")
    .addStringOption(opt => opt.setName("texte").setDescription("Texte").setRequired(false))
    .addAttachmentOption(opt => opt.setName("image1").setDescription("Image 1"))
    .addAttachmentOption(opt => opt.setName("image2").setDescription("Image 2"))
    .addAttachmentOption(opt => opt.setName("image3").setDescription("Image 3"))
    .addAttachmentOption(opt => opt.setName("image4").setDescription("Image 4"))
    .addAttachmentOption(opt => opt.setName("image5").setDescription("Image 5"))
    .addAttachmentOption(opt => opt.setName("image6").setDescription("Image 6")),
].map(c => c.toJSON());

// === Interaction handler (robuste) ===
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "écrire") return;

  try {
    // Acquittement immédiat pour éviter expiration
    await interaction.deferReply({ ephemeral: true });

    const texte = interaction.options.getString("texte");
    const images = [];
    for (let i = 1; i <= 6; i++) {
      const att = interaction.options.getAttachment(`image${i}`);
      if (att) images.push(att);
    }

    if (!texte && images.length === 0) {
      await interaction.editReply({ content: "⚠️ Tu dois fournir un texte ou au moins une image." });
      return;
    }

    // Construire payload public
    const messagePayload = {};
    if (texte) messagePayload.content = texte;
    if (images.length > 0) {
      // Utilise les URLs des attachments (discord.js fournit .url)
      messagePayload.files = images.map(a => ({ attachment: a.url, name: a.name || "image.jpg" }));
    }

    // Récupère le channel en sécurité
    const channelId = interaction.channelId;
    if (!channelId) {
      await interaction.editReply({ content: "❌ Impossible de trouver le salon." });
      return;
    }

    const channel = await client.channels.fetch(channelId).catch(err => {
      console.error("Erreur fetch channel:", err);
      return null;
    });

    if (!channel || !channel.isTextBased()) {
      await interaction.editReply({ content: "❌ Le salon n'accepte pas les messages publics." });
      return;
    }

    // Envoie public (avec try/catch pour capturer permissions / erreurs réseau)
    try {
      await channel.send(messagePayload);
    } catch (err) {
      console.error("Erreur lors de l'envoi public:", err);
      await interaction.editReply({
        content: "❌ Je n'ai pas pu envoyer le message publiquement (permissions ou type de salon).",
      });
      return;
    }

    // Confirme à l'utilisateur (reply privé édité)
    await interaction.editReply({ content: "✅ Message envoyé anonymement." });
  } catch (error) {
    console.error("Erreur interactionCreate:", error);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: "⚠️ Une erreur est survenue. Réessaie." });
      } else {
        await interaction.reply({ content: "⚠️ Une erreur est survenue. Réessaie.", ephemeral: true });
      }
    } catch (e) {
      console.error("Impossible d'informer l'utilisateur:", e);
    }
  }
});

// === Enregistrement / déploiement des commandes ===
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🚀 Déploiement des commandes slash...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log("✅ Commandes déployées avec succès !");
  } catch (err) {
    console.error("❌ Erreur lors du déploiement des commandes :", err);
  }
})();

// === Connexion ===
client.login(process.env.TOKEN);

// === Gestion globale des erreurs ===
process.on("unhandledRejection", (r) => console.log("UnhandledRejection:", r));
process.on("uncaughtException", (err) => console.log("UncaughtException:", err));

// === Petit serveur Express pour keep-alive Render ===
const app = express();
app.get("/", (req, res) => res.send("TopIdiom bot en ligne 🟢"));
app.listen(3000, () => console.log("Serveur keep-alive sur :3000"));
