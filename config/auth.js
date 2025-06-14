const localStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')
const Usuario = require('../models/Usuario')

module.exports = function(passport) {
    passport.use(new localStrategy({usernameField: 'email', passwordField: 'senha'}, (email, senha, done) => {
        Usuario.findOne({where: {email_usuario: email}}).then((usuario) => {
            if (!usuario) {
                return done(null, false, {message: 'Essa conta não existe'})
            }

            bcrypt.compare(senha, usuario.senha_usuario, (erro, batem) => {
                if (batem) {
                    return done(null, usuario)
                } else {
                    return done(null, false, {message: 'Senha incorreta'})
                }
            })
        })
    }))

    passport.serializeUser((usuario, done) => {
        done(null, usuario.id_usuario)
    })

    passport.deserializeUser((id, done) => {
        Usuario.findByPk(id).then(usuario => {
            done(null, usuario)
        })
        .catch(err => {
            done(err, null)
        })
    })
}