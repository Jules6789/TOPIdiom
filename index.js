import { Client, GatewayIntentBits, Routes, REST, SlashCommandBuilder } from 'discord.js';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// === Commandes ===
const commands = [
    new SlashCommandBuilder()
        .setName('écrire')
        .setDescription('Le bot écrit un message anonyme avec ou sans images.')
        .addStringOption(option =>
            option.setName('texte')
                .setDescription('Le message à envoyer')
                .setRequired(false))
        .addAttachmentOption(option => option.setName('image1').setDescription("Image 1"))
        .addAttachmentOption(option => option.setName('image2').setDescription("Image 2"))
        .addAttachmentOption(option => option.setName('image3').setDescription("Image 3"))
        .addAttachmentOption(option => option.setName('image4').setDescription("Image 4"))
        .addAttachmentOption(option => option.setName('image5').setDescription("Image 5"))
        .addAttachmentOption(option => option.setName('image6').setDescription("Image 6"))
].map(cmd => cmd.toJSON());

// === Interaction ===
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'écrire') return;

    const texte = interaction.options.getString('texte');
    const images = [];

    for (let i = 1; i <= 6; i++) {
        const img = interaction.options.getAttachment(`image${i}`);
        if (img) images.push(img);
    }

    if (!texte && images.length === 0) {
        await interaction.reply({ content: 'Tu dois fournir un texte ou au moins une image.', ephemeral: true });
        return;
    }

    const messagePayload = {};
    if (texte) messagePayload.content = texte;
    if (images.length > 0) messagePayload.files = images;

    await interaction.reply({ content: '✅ Message envoyé anonymement.', ephemeral: true });
    await interaction.channel.send(messagePayload);
});

// === Enregistrement des commandes ===
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🚀 Déploiement des commandes...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('✅ Commandes déployées avec succès !');
    } catch (error) {
        console.error('❌ Erreur lors du déploiement des commandes :', error);
    }
})();

client.login(process.env.TOKEN);

// Empêche les crashs dus à des erreurs non gérées
process.on('unhandledRejection', (reason, promise) => {
  console.log('⚠️ Rejet non géré :', reason);
});
process.on('uncaughtException', (err) => {
  console.error('💥 Erreur non capturée :', err);
});

// Empêche Render d'arrêter le bot
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot en ligne 🟢'));
app.listen(3000, () => console.log('Serveur keep-alive pour Render démarré.'));

