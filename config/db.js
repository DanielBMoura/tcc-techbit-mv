const Sequelize = require('sequelize')

// Conexão com o Banco de Dados
const sequelize = new Sequelize('dbtcc', 'root', '12345', {
    host: 'localhost',
    dialect: 'mysql'
})

module.exports = {
    Sequelize: Sequelize,
    sequelize: sequelize
}