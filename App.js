// Chamar a instalações
    const express = require('express')
    const app = express()
    const bodyParser = require('body-parser')
    const admin = require('./routes/admin')
    const usuarios = require('./routes/user')

    const session = require('express-session')
    const flash = require('connect-flash')

    const passport = require('passport')
    require('./config/auth')(passport)

    const db = require('./config/db')
    require('./models/associations')

// Agendador
    const cron = require('node-cron')
    const { limparOrcamentosAntigos } = require('./config/carrinhoService')

    cron.schedule('0 0 * * *', async () => {
        console.log('Iniciando limpeza automática de orçamentos antigos...', new Date().toISOString())
    
        const resultado = await limparOrcamentosAntigos()
        console.log('Limpeza concluída com sucesso: ', resultado)
    }, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
    })

// Criação das tabelas do Banco de Dados
    // db.sequelize.sync({ force: true })

// Configurações
    // Sessão
        app.use(session({
            secret: '123',
            resave: true,
            saveUninitialized: true
        }))

        app.use(passport.initialize())
        app.use(passport.session())

    // Flash
        app.use(flash())

    // Middleware 
        app.use((req, res, next) => {
            res.locals.success_msg = req.flash('success_msg')
            res.locals.error_msg = req.flash('error_msg')
            res.locals.error = req.flash("error")
            res.locals.user = req.user || null
            next()
        })

    // Body-Parser
        app.use(bodyParser.urlencoded({extended: true}))
        app.use(bodyParser.json())

    // ejs
        app.set('view engine', 'ejs')
        app.set('views', __dirname + '/views')
        app.use(express.static('public'))

    // node-cron
        cron.schedule('0 0 * * *', async () => {
            console.log('Executando limpeza de orçamentos antigos...')
            await limparOrcamentosAntigos()
        })

// Rotas
    // Rotas dos usuarios
        app.use('/', usuarios)

    // Rotas do admin
        app.use('/Admin', admin)

// Ligar o servidor
app.listen(3000, function(){
    console.log('Servidor rodando na porta 3000')
})