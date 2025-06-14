const db = require('../config/db')

const NewsletterEmail = db.sequelize.define('newsletterEmails', {
    id_emails_newsletter: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    assunto_emails_newsletter: {
        type: db.Sequelize.STRING(255),
        allowNull: false
    },
    mensagem_emails_newsletter: {
        type: db.Sequelize.TEXT,
        allowNull: false 
    },
    data_envio_newsletter: {
        type: db.Sequelize.DATE,
        allowNull: false,
        defaultValue: db.Sequelize.NOW
    }
})

module.exports = NewsletterEmail