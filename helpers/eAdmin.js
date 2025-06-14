module.exports = {
    eAdmin: function(req, res, next){
        if (req.isAuthenticated() && req.user.eAdmin == 1) {    // req.isAuthenticated() && req.user.eAdmin == 1
            return next()
        }

        req.flash('error_msg', 'Rota indisponível')
        res.redirect('/')
    }
}

// Se eu precisar verificar se o usuario está logado para favoritar, ver aqui e/ou video 60