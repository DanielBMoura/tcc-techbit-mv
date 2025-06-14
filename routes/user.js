// Chamar a instalações
    const express = require('express')
    const router = express.Router()
    const bcrypt = require('bcryptjs')
    const passport = require('passport')
    const { Op } = require('sequelize')
    const nodemailer = require('nodemailer')
    const path = require('path')    // <-- NÃO SEI SE É NECESSÁRIO

// Tabelas do Banco de Dados
    const Usuario = require('../models/Usuario')
    const Endereco = require('../models/Endereco')
    const Categoria = require('../models/Categoria')
    const SubCategoria = require('../models/SubCategoria')
    const Produto = require('../models/Produto')
    const CategoriaBlog = require('../models/CategoriaBlog')
    const PostagemBlog = require('../models/PostagemBlog')
    const Orcamento = require('../models/Orcamento')
    const ItensOrcamento = require('../models/ItensOrcamento')
    const NewsletterUsuario = require('../models/NewsletterUsuario')

// Rotas
    router.get('/', function(req, res) {
        res.render('usuarios/index')
    })

    router.get('/Produtos', async function(req, res) {
        const categorias = await Categoria.findAll({
            include: [{
                model: SubCategoria,
                as: 'subcategorias',
                include: [{
                    model: Produto,
                    as: 'produtos'
                }]
            }]
        })

        let orcamento = null
        let itensOrcamento =[]
        let produtos = []
        let produtosComImagens = []
        let numProduto = 0

        if (req.user) {
            let id_usuario = req.user.id_usuario
            orcamento = await Orcamento.findAll({ where: { id_usuario: id_usuario, status_orcamento: 'Em andamento' } })

            if (orcamento.length > 0) {

                itensOrcamento = await ItensOrcamento.findAll({ where: { id_orcamento: orcamento[0].id_orcamento } })

                numProduto = itensOrcamento.length

                if (itensOrcamento.length > 0) {
                    let produtosIds = itensOrcamento.map(item => item.id_produto)
                    produtos = await Produto.findAll({ where: { id_produto: produtosIds } })

                    produtosComImagens = produtos.map(produto => {
                        let primeiraImagem = null
            
                        const imagensArray = JSON.parse(produto.imagens_produto)
            
                        primeiraImagem = imagensArray[0]

                        let itemOrcamento = itensOrcamento.find(item => item.id_produto === produto.id_produto)
                        let quantidade = itemOrcamento.dataValues.quantidade_itemOrcamento  // Alterado aqui era: let quantidade = itemOrcamento ? itemOrcamento.dataValues.quantidade_itemOrcamento : 0;
            
                        return {
                            ...produto.dataValues,
                            primeiraImagem,
                            quantidade
                        }
                    })
                }
            }
        }

        res.render('usuarios/produtos', { categorias, produtos: produtosComImagens, itensOrcamento, numProduto })
    })

    router.get('/Contato', function(req, res) {
        res.render('usuarios/contato')
    })

    router.get('/Login', function(req, res) {
        res.render('usuarios/login')    // -> FUTURAMENTE: Entrar com o google, facebook, etc
    })

    router.get('/Cadastro', function(req, res) {
        res.render('usuarios/cadastro')
    })

    router.post(['/cadastro-form', '/Admin/cadastroAdm-form'], async function(req, res) {
        // Verifica de que rota vem a requisição
        const rotaAdmin = req.originalUrl === '/Admin/cadastroAdm-form' || 
                          req.path === '/Admin/cadastroAdm-form' || 
                          req.baseUrl === '/Admin/cadastroAdm-form'

        const eAdmin = rotaAdmin ? 1 : 0

        const redirectPath = rotaAdmin ? '/Admin/Usuarios' : '/Login'

        // Cria as variaveis com os valoris vindo do formulario
        let { nome, email, senha, telefone, dataNascimento, rua, numero, complemento, bairro, cidade, uf, cep } = req.body

    // ----------------------Criação de variaveis--------------------------------------

        let erros = []

        const caracteresInvalidos = [    
            '!', '"', '#', '$', '%', '&', "'", '*', '+', ',', '-', '.', '/',
            ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '_', '`', '{', '|',
            '}', '~', '´', '¨', '¿', '¡','\n', '\r', '\t'
        ]

        const emailRegex = /^(?!.*\.\.)[a-zA-Z0-9._%+-]+(?<!\.)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
        const emailExistente = await Usuario.findOne({ where: { email_usuario: email } })

        const letraMaiuscula = /[A-Z]/
        const letraMinuscula = /[a-z]/
        const numeros = /\d/
        const caractereEspecial = /[!@#$%^&*(),.?":{}|<>[\]~_+;='-]/

        const telefoneLimpo = telefone.replace(/[()-]/g, "")
        const telefoneExistente = await Usuario.findOne({ where: { telefone_usuario: telefoneLimpo } })
        const ddds = [
            "61", "62", "64", "65", "66", "67", "82", "71", "73", "74", "75", 
            "77", "85", "88", "98", "99", "83", "81", "87", "86", "89", "84", 
            "79", "68", "96", "92", "97", "91", "93", "94", "69", "95", "63",
            "27", "28", "31", "32", "33", "34", "35", "37", "38", "21", "22", 
            "24", "11", "12", "13", "14", "15", "16", "17", "18", "19", "41", 
            "42", "43", "44", "45", "46", "51", "53", "54", "55", "47", "48", "49"
        ]
    
        function calcularIdade() {
            let idade = dataAtual.getFullYear() - dataNascimentoo.getFullYear()
            const mesAtual = dataAtual.getMonth()
            const mesNasc = dataNascimentoo.getMonth()
            const diaAtual = dataAtual.getDate()
            const diaNasc = dataNascimentoo.getDate()
        
            if (mesAtual < mesNasc || (mesAtual === mesNasc && diaAtual < diaNasc)) {
                idade--
            }
            
            return idade
        }

        let dataAtual = new Date()
        let dataNascimentoo = new Date(dataNascimento)
        let idade = calcularIdade()

        const cepNumerico = cep.replace('-', '')

    // ----------------------Validações--------------------------------------

        for (let i = 0; i < rua.length; i++) {
            if (caracteresInvalidos.includes(rua[i])) {
                erros.push({mensagem: 'Rua/Avenida inválida - Possui caracteres inválidos'})
            }
        }

        if (!rua || rua.trim().length === 0) {
            erros.push({mensagem: 'Rua/Avenida inválida - Rua/Avenida em branco'})
        }

        for (let i = 0; i < numero.length; i++) {
            if (caracteresInvalidos.includes(numero[i])) {
                erros.push({mensagem: 'Número inválido - Possui caracteres inválidos'})
            }
        }

        for (let i = 0; i < bairro.length; i++) {
            if (caracteresInvalidos.includes(bairro[i])) {
                erros.push({mensagem: 'Bairro inválido - Possui caracteres inválidos'})
            }
        }

        if (!bairro || bairro.trim().length === 0) {
            erros.push({mensagem: 'Bairro - Bairro em branco'})
        }

        for (let i = 0; i < cidade.length; i++) {
            if (caracteresInvalidos.includes(cidade[i])) {
                erros.push({mensagem: 'Cidade inválida - Possui caracteres inválidos'})
            }
        }

        if (!cidade || cidade.trim().length === 0) {
            erros.push({mensagem: 'Cidade inválida - Cidade em branco'})
        }

        if (!uf || uf.trim().length === 0) {
            erros.push({mensagem: 'UF inválida - UF em branco'})
        }

        for (let i = 0; i < nome.length; i++) {
            if (caracteresInvalidos.includes(nome[i])) {
                erros.push({mensagem: 'Nome inválido - Possui caracteres inválidos'})
            }
        }

        if (!emailRegex.test(email)) {
            erros.push({mensagem: 'Email inválido - Não possui o formato comum de um email'})
        }

        if (email.length > 254) {
            erros.push({mensagem: 'Email inválido - Maior que o possivel'})
        }

        if (emailExistente) {
            erros.push({mensagem: 'Email inválido - Email já está cadastrado'})
        }

        if (!letraMaiuscula.test(senha)) {
            erros.push({mensagem: 'Senha inválida - A senha precisa conter uma letra maiúscula'})
        }

        if (!letraMinuscula.test(senha)) {
            erros.push({mensagem: 'Senha inválida - A senha precisa conter uma senha minúscula'})
        }

        if (!numeros.test(senha)) {
            erros.push({mensagem: 'Senha inválida - A senha precisa conter números'})
        }

        if (!caractereEspecial.test(senha)) {
            erros.push({mensagem: 'Senha inválida - A senha precisa conter um caractere especial'})
        }

        if (senha.length < 8) {
            erros.push({mensagem: 'Senha inválida - A senha é curta'})
        }

        if (senha.length > 64) {
            erros.push({mensagem: 'Senha inválida - A senha é longa'})
        }

        if (senha !== req.body.confirmarSenha) {
            erros.push({mensagem: 'Senha inválida - A senha não corresponde com o confirmar senha'})
        }

        if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
            erros.push({mensagem: 'Telefone inválido - Telefone muito curto'})
        }

        if (telefoneExistente) {
            erros.push({mensagem: 'Telefone inválido - Telefone já está cadastrado'})
        }

        if (!ddds.includes(telefoneLimpo.slice(0, 2))) {
            erros.push({mensagem: 'Telefone inválido - DDD inválido'})
        }

        if (dataNascimentoo > dataAtual) {
            erros.push({mensagem: 'Data de Nascimento inválida - Data de nascimento maior que a data atual'})
        }

        if (idade < 18) {
            erros.push({mensagem: 'Data de Nascimento inválida - Usuario menor de idade'})
        }

        if (idade > 116) {
            erros.push({mensagem: 'Data de Nascimento inválida - Data de nascimento não correspondente'})
        }

    // ----------------------Criação no Banco de dados--------------------------------------

        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {
            let enderecoExistente = await Endereco.findOne({
                where: {
                    rua: rua,
                    cidade: cidade,
                    uf: uf,
                    cep: cepNumerico
                }
            })

            if (enderecoExistente) {

                bcrypt.genSalt(10, (erro, salt) => {
                    bcrypt.hash(senha, salt, async (erro, hash) => {
                        if(erro){
                            console.log('Houve um erro durante o salvamento do usuario')
                        }

                        senha = hash

                        // Cria um novo usuario
                        const novoUsuario = await Usuario.create({
                            nome_usuario: nome,
                            email_usuario: email,
                            senha_usuario: senha,
                            telefone_usuario: telefoneLimpo,
                            data_nascimento_usuario: dataNascimento,
                            eAdmin: eAdmin,
                            id_endereco: enderecoExistente.id_endereco,
                            numero: numero,
                            complemento: complemento || null
                        })
                        
                    })
                })
            } else {
                bcrypt.genSalt(10, (erro, salt) => {
                    bcrypt.hash(senha, salt, async (erro, hash) => {
                        if(erro){
                            console.log('Houve um erro durante o salvamento do usuario')
                        }

                        senha = hash

                        // Cria um novo endereço
                        const novoEndereco = await Endereco.create({
                            rua,
                            bairro,
                            cidade,
                            uf,
                            cep: cepNumerico 
                        })

                        // Cria um novo usuario
                        const novoUsuario = await Usuario.create({
                            nome_usuario: nome,
                            email_usuario: email,
                            senha_usuario: senha,
                            telefone_usuario: telefoneLimpo,
                            data_nascimento_usuario: dataNascimento,
                            eAdmin: eAdmin,
                            id_endereco: novoEndereco.id_endereco,
                            numero: numero,
                            complemento: complemento || null,
                        })
                    })
                })
            }
            res.status(200).json({ mensagem: 'Usuário criado com sucesso', redirect: redirectPath })
        }
    })

    router.get('/Produtos/:slug', async(req, res) => {
        const categoria = await Categoria.findOne({where:{slug_categoria: req.params.slug}})
        const subCategorias = await SubCategoria.findAll({where:{id_categoria: categoria.id_categoria}})

        const categorias = await Categoria.findAll({
            include: [{
                model: SubCategoria,
                as: 'subcategorias',
                include: [{
                    model: Produto,
                    as: 'produtos'
                }]
            }]
        })
        
        let orcamento = null
        let itensOrcamento =[]
        let produtos = []
        let produtosComImagens = []
        let numProduto = 0

        if (req.user) {
            let id_usuario = req.user.id_usuario
            orcamento = await Orcamento.findAll({ where: { id_usuario: id_usuario, status_orcamento: 'Em andamento' } })

            if (orcamento.length > 0) {

                itensOrcamento = await ItensOrcamento.findAll({ where: { id_orcamento: orcamento[0].id_orcamento } })

                numProduto = itensOrcamento.length

                if (itensOrcamento.length > 0) {
                    let produtosIds = itensOrcamento.map(item => item.id_produto)
                    produtos = await Produto.findAll({ where: { id_produto: produtosIds } })

                    produtosComImagens = produtos.map(produto => {
                        let primeiraImagem = null
            
                        const imagensArray = JSON.parse(produto.imagens_produto)
            
                        primeiraImagem = imagensArray[0]

                        let itemOrcamento = itensOrcamento.find(item => item.id_produto === produto.id_produto)
                        let quantidade = itemOrcamento.dataValues.quantidade_itemOrcamento  // Alterado aqui era: let quantidade = itemOrcamento ? itemOrcamento.dataValues.quantidade_itemOrcamento : 0;
            
                        return {
                            ...produto.dataValues,
                            primeiraImagem,
                            quantidade
                        }
                    })
                }
            }
        }

        res.render('usuarios/produtos/subCategoria', {subCategorias, categoria, categorias, produtos: produtosComImagens, numProduto})
    })

    router.get('/Produtos/:slug/:slugSubCategoria', async(req, res) => {

        const categoria = await Categoria.findOne({where:{slug_categoria: req.params.slug}})
        const subCategoria = await SubCategoria.findOne({where:{slug_subCategoria: req.params.slugSubCategoria}})
        const produtosEmGeral = await Produto.findAll({where:{id_subCategoria: subCategoria.id_subCategoria}})

        const categorias = await Categoria.findAll({
            include: [{
                model: SubCategoria,
                as: 'subcategorias',
                include: [{
                    model: Produto,
                    as: 'produtos'
                }]
            }]
        })

        let orcamento = null
        let itensOrcamento =[]
        let produtos = []
        let produtosComImagens = []
        let numProduto = 0

        if (req.user) {
            let id_usuario = req.user.id_usuario
            orcamento = await Orcamento.findAll({ where: { id_usuario: id_usuario, status_orcamento: 'Em andamento' } })

            if (orcamento.length > 0) {

                itensOrcamento = await ItensOrcamento.findAll({ where: { id_orcamento: orcamento[0].id_orcamento } })

                numProduto = itensOrcamento.length

                if (itensOrcamento.length > 0) {
                    let produtosIds = itensOrcamento.map(item => item.id_produto)
                    produtos = await Produto.findAll({ where: { id_produto: produtosIds } })

                    produtosComImagens = produtos.map(produto => {
                        let primeiraImagem = null
            
                        const imagensArray = JSON.parse(produto.imagens_produto)
            
                        primeiraImagem = imagensArray[0]

                        let itemOrcamento = itensOrcamento.find(item => item.id_produto === produto.id_produto)
                        let quantidade = itemOrcamento.dataValues.quantidade_itemOrcamento  // Alterado aqui era: let quantidade = itemOrcamento ? itemOrcamento.dataValues.quantidade_itemOrcamento : 0;
            
                        return {
                            ...produto.dataValues,
                            primeiraImagem,
                            quantidade
                        }
                    })
                }
            }
        }

        const produtosGeraisImagens = produtosEmGeral.map(produto => {
            let primeiraImagem = null

            const imagensArray = JSON.parse(produto.imagens_produto)

            primeiraImagem = imagensArray[0]

            return {
                ...produto.dataValues,
                primeiraImagem
            }
        })

        res.render('usuarios/produtos/produtos', {categorias, produtosEmGeral: produtosGeraisImagens, subCategoria, categoria, produtos: produtosComImagens, numProduto})
    })

    router.get('/Produtos/:slugCategoria/:slugSubCategoria/:slugProduto', async(req, res) => {
        const categoria = await Categoria.findOne({where:{slug_categoria: req.params.slugCategoria}})
        const subCategoria = await SubCategoria.findOne({where:{slug_subCategoria: req.params.slugSubCategoria, id_categoria: categoria.id_categoria}})
        const produto = await Produto.findOne({where:{slug_produto: req.params.slugProduto, id_subCategoria: subCategoria.id_subCategoria}})
        
        const outrosProdutos = await Produto.findAll(
            {where:{id_subCategoria: subCategoria.id_subCategoria, 
            id_produto: { [Op.ne]: produto.id_produto }}}
        )

        let orcamento = null
        let itensOrcamento =[]
        let produtos = []
        let produtosComImagens = []
        let numProduto = 0

        if (req.user) {
            let id_usuario = req.user.id_usuario
            orcamento = await Orcamento.findAll({ where: { id_usuario: id_usuario, status_orcamento: 'Em andamento' } })

            if (orcamento.length > 0) {

                itensOrcamento = await ItensOrcamento.findAll({ where: { id_orcamento: orcamento[0].id_orcamento } })
                numProduto = itensOrcamento.length

                if (itensOrcamento.length > 0) {
                    let produtosIds = itensOrcamento.map(item => item.id_produto)
                    produtos = await Produto.findAll({ where: { id_produto: produtosIds } })

                    produtosComImagens = produtos.map(produto => {
                        let primeiraImagem = null
            
                        const imagensArray = JSON.parse(produto.imagens_produto)
            
                        primeiraImagem = imagensArray[0]

                        let itemOrcamento = itensOrcamento.find(item => item.id_produto === produto.id_produto)
                        let quantidade = itemOrcamento.dataValues.quantidade_itemOrcamento  // Alterado aqui era: let quantidade = itemOrcamento ? itemOrcamento.dataValues.quantidade_itemOrcamento : 0;
            
                        return {
                            ...produto.dataValues,
                            primeiraImagem,
                            quantidade
                        }
                    })
                }
            }
        }

        let imagens = []
        let imagemPrincipal = null

        if (produto.imagens_produto) {      // Tirei o "?", era produto?.imagens_produto
            imagens = JSON.parse(produto.imagens_produto)
        
            imagemPrincipal = imagens[0]
        }

        const outrosProdutosImagens = outrosProdutos.map(produto => {
            let primeiraImagem = null

            const imagensArray = JSON.parse(produto.imagens_produto)

            primeiraImagem = imagensArray[0]

            return {
                ...produto.dataValues,
                primeiraImagem
            }
        })

        res.render('usuarios/produtos/produtosIndividuais/paginaProdutos', {produto, outrosProdutos: outrosProdutosImagens, subCategoria, categoria, imagemPrincipal, imagens, produtos: produtosComImagens, numProduto})
    })

    router.post('/login-form', (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            
            if (err) return res.status(500).json({ error: 'Erro no servidor' })
            if(!user) return res.status(401).json({ error: info.message })

            req.logIn(user, (err) => {
                if (err) return res.status(500).json({ error: 'Erro ao fazer login' })
                return res.json({ message: 'Login bem-sucedido', user })
            })

        })(req, res, next)
    })

    router.get('/logout', (req, res, next) => {
        req.logout(function(err) {
            if (err) {
                return next(err)
            }
            return res.json({ message: 'Deslogado com sucesso' })
        })
    })

    router.get('/buscar', async(req, res) => {
        const query = req.query.query || ""

        const resultadoProduto = await Produto.findAll({
            where: { nome_produto: { [Op.like]: `${query}%` } },
            include: [{
                model: SubCategoria,
                as: 'subcategoria',
                attributes: ['slug_subCategoria'],
                include: [{
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['slug_categoria']
                }]
            }]
        })

        const resultadoSubCategoria = await SubCategoria.findAll({
            where: { nome_subCategoria: { [Op.like]: `${query}%` } },
            include: [{
                model: Categoria,
                as: 'categoria', // Alias correto
                attributes: ['slug_categoria']
            }]
        })

        const resultadoCategoria = await Categoria.findAll({
            where: { nome_categoria: { [Op.like]: `${query}%` } }
        })

        // VER DE FAZER FUTURAMENTE UMA TABELA PARA PESQUISAS:
        // Atualizando o banco de dados com o log da pesquisa
            // await Pesquisa.create({ termo_pesquisa: query, data_hora: new Date() })

        const resultados = [
            ...resultadoProduto, 
            ...resultadoSubCategoria, 
            ...resultadoCategoria
        ]

        res.json(resultados)
    })

    router.get('/Blog', async(req, res) => {
        const postagens = await PostagemBlog.findAll({
            include: {
                model: CategoriaBlog,
                as: 'categoriaBlog'
            },
            order: [['data_postagemBlog', 'DESC']]
        })

        postagens.forEach(postagem => {

            const dataFormatada = new Date(postagem.dataValues.data_postagemBlog).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(',', '')

            postagem.dataValues.data_postagemBlog = dataFormatada
        })

        res.render('usuarios/blog', { postagens })
    })

    router.get('/Postagem/:slug', async(req, res) => {
        const postagem = await PostagemBlog.findOne({ where: { slug_postagemBlog: req.params.slug } })

        const dataFormatada = new Date(postagem.dataValues.data_postagemBlog).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', '')

        postagem.dataValues.data_postagemBlog = dataFormatada

        res.render('usuarios/blog/postagens', { postagem })
    })

    router.get('/Categorias-Blog', async(req, res) => {
        const categorias = await CategoriaBlog.findAll()

        res.render('usuarios/blog/categorias', { categorias })
    })
    
    router.get('/Categorias-Blog/:slug', async(req, res) => {
        const categoria = await CategoriaBlog.findOne({ where: { slug_categoriaBlog: req.params.slug } })
        const postagensCategoria = await PostagemBlog.findAll({ where: { id_categoriaBlog: categoria.id_categoriaBlog } })

        postagensCategoria.forEach(postagem => {

            const dataFormatada = new Date(postagem.dataValues.data_postagemBlog).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(',', '')

            postagem.dataValues.data_postagemBlog = dataFormatada
        })

        res.render('usuarios/blog/categoriaPostagens', { categoria, postagensCategoria })
    })

    router.post('/Verificar-Autenticacao', async (req, res) => {
        if (req.isAuthenticated()) {
            res.json({ autenticado: true})
        } else {
            res.json({ autenticado: false })
        }
    })

    router.post('/Adicionar-Ao-Carrinho', async(req, res) => {

        let erros = []

        let id_usuario = req.user.id_usuario
        let id_produto = req.body.id_produto

        let quantidade = req.body.quantidade_produto

        let numProduto = 0

        let produto = await Produto.findOne({ where: { id_produto: id_produto } })

        let orcamentoEmAndamento = await Orcamento.findOne({
            where: { id_usuario: id_usuario, status_orcamento: 'Em andamento' }
        })

        if (produto.estoque_produto < quantidade) {
            const estoqueAproximado = Math.floor(produto.estoque_produto / 100) * 100

            erros.push({ mensagem: `Quantidade indisponível em estoque - Cerca de ${estoqueAproximado} produtos em estoque` })
        }

        // VER SE TEM MAIS VALIDAÇÃO OU QUALQUER OUTRA COISA, SE NN TIVER, TIRAR O ERROS.LENGTH

        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {

            if (orcamentoEmAndamento) {
                let itemOrcamento = await ItensOrcamento.findOne({where: { id_produto: id_produto,  id_orcamento: orcamentoEmAndamento.id_orcamento }})

                if (itemOrcamento) {
                        
                    let novaQuantidade = Number(itemOrcamento.quantidade_itemOrcamento) + Number(req.body.quantidade_produto)

                    const itensOrcamentoAdicionado = await ItensOrcamento.update({
                        quantidade_itemOrcamento: novaQuantidade
                    }, {where: { id_produto: id_produto, id_orcamento: orcamentoEmAndamento.id_orcamento }})

                } else {
                    const itensOrcamentoCriado = await ItensOrcamento.create({
                        id_produto: id_produto,
                        id_orcamento: orcamentoEmAndamento.id_orcamento,
                        quantidade_itemOrcamento: quantidade
                    })
                }

                const todosProdutosOrcamento = await ItensOrcamento.findAll({
                    where: { id_orcamento: orcamentoEmAndamento.id_orcamento }
                })
    
                for (let i = 0; i < todosProdutosOrcamento.length; i++) {
                    numProduto +=1
                }                

            } else {
                const orcamentoCriado = await Orcamento.create({    
                    id_usuario: id_usuario
                })

                const orcamentoNum = await Orcamento.update({    
                    numero_orcamento: orcamentoCriado.id_orcamento
                }, {where: {id_orcamento: orcamentoCriado.id_orcamento}})
        
                const itensOrcamentoCriado = await ItensOrcamento.create({
                    id_produto: id_produto,
                    id_orcamento: orcamentoCriado.id_orcamento,
                    quantidade_itemOrcamento: req.body.quantidade_produto
                })

                const todosProdutosOrcamento = await ItensOrcamento.findAll({
                    where: { id_orcamento: orcamentoCriado.id_orcamento }
                })
    
                for (let i = 0; i < todosProdutosOrcamento.length; i++) {
                    numProduto +=1
                }
            }
    
            let novaQuantidadeEstoque = produto.estoque_produto - quantidade

            const produtoAtualizado = await Produto.update({
                estoque_produto: novaQuantidadeEstoque
            }, { where: { id_produto: id_produto }})
    
            return res.status(200).json({ mensagem: 'Produto adicionado ao carrinho', reload: true})
        }
    })

    router.post('/Excluir-Carrinho', async (req, res) => {
        let id_produto = req.body.id
        let id_usuario = req.body.id_usuario

        let produto = await Produto.findOne({
            where: { id_produto: id_produto }
        })

        let orcamento = await Orcamento.findOne({
            where: { id_usuario: id_usuario, status_orcamento: 'Em andamento' }
        })

        const itensOrcamento = await ItensOrcamento.findOne({
            where: { id_produto: id_produto, id_orcamento: orcamento.id_orcamento }
        })

        let novaQuantidadeEstoque = produto.estoque_produto + itensOrcamento.quantidade_itemOrcamento

        const produtoAtualizado = await Produto.update({
            estoque_produto: novaQuantidadeEstoque
        }, { where: { id_produto: id_produto }})

        const itensOrcamentoDeletado = await ItensOrcamento.destroy({
            where: { id_produto: id_produto, id_orcamento: orcamento.id_orcamento }
        })

        return res.status(200).json({ mensagem: 'Produto deletado do carrinho', reload: true})
    })


    // DPS COLOCAR QUE PARA ACESSAR ESSA ROTA TEM QUE SER AUTENTICADO
    router.get('/Orcamento', async (req, res) => {

        let orcamento = null
        let itensOrcamento =[]
        let produtos = []
        let produtosComImagens = []

        if (req.user) {
            let id_usuario = req.user.id_usuario
            orcamento = await Orcamento.findAll({ where: { id_usuario: id_usuario, status_orcamento: 'Em andamento' } })

            if (orcamento.length > 0) {

                itensOrcamento = await ItensOrcamento.findAll({ where: { id_orcamento: orcamento[0].id_orcamento } })

                if (itensOrcamento.length > 0) {
                    let produtosIds = itensOrcamento.map(item => item.id_produto)
                    produtos = await Produto.findAll({ where: { id_produto: produtosIds } })

                    produtosComImagens = produtos.map(produto => {
                        let primeiraImagem = null
            
                        const imagensArray = JSON.parse(produto.imagens_produto)
            
                        primeiraImagem = imagensArray[0]

                        let itemOrcamento = itensOrcamento.find(item => item.id_produto === produto.id_produto)
                        let quantidade = itemOrcamento.dataValues.quantidade_itemOrcamento  // Alterado aqui era: let quantidade = itemOrcamento ? itemOrcamento.dataValues.quantidade_itemOrcamento : 0;
            
                        return {
                            ...produto.dataValues,
                            primeiraImagem,
                            quantidade
                        }
                    })
                }
            }
        }

        res.render('usuarios/orcamento/orcamento', { produtos: produtosComImagens, itensOrcamento})
    })

    router.post('/Orcamento/finalizarOrcamento', async (req, res) => {
        const produtos = JSON.parse(req.body.produtos)

        let email_usuario = null
        
        if (req.user) {
            email_usuario = req.user.email_usuario
        }

        res.render('usuarios/orcamento/finalizarOrcamento', {email_usuario, produtos})
    })

    router.post('/Enviar-email', async (req, res) => {
        // FAZER VALIDAÇÕES
        let produtos = JSON.parse(req.body.produtos)
        let nome_usuario
        let email_usuario

        if (req.user) {
            nome_usuario = req.user.nome_usuario
            email_usuario = req.user.email_usuario
        }

        const enviarOrcamento = (nomeUser, emailUser, produtosOrcamento) => {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'testetccrebites@gmail.com',
                    pass: 'dzzp ylul mejo avzr' // Ver o ngc da senha
                }
            })

            const corpoEmail =
            `Orçamento do usuário: ${nomeUser} | ${emailUser} \nProdutos e quantidades: \n${produtosOrcamento.map(p => `- Produto: ${p.nome} | Quantidade: ${p.quantidade}`).join('\n')}`
        
            const mailOptions = {
                from: 'testetccrebites@gmail.com',
                to: 'testetccrebites@gmail.com',
                subject: 'Novo orçamento',
                text: corpoEmail
            }

            return transporter.sendMail(mailOptions)
        }

        await enviarOrcamento(nome_usuario, email_usuario, produtos)

        const novoStatusOrcamento = await Orcamento.update({
            status_orcamento: 'Aguardando resposta do Administrador'
        }, { where: { status_orcamento: 'Em andamento', id_usuario: req.user.id_usuario } })

        return res.status(200).json({ mensagem: 'E-mail enviado com sucesso. Espere cerca de 4 horas para receber a resposta', redirect: '/'})
    })

    router.post('/UsuariosPerfil', async (req, res) => {
        if (req.isAuthenticated()) {
            res.json({
                success: true,
                user: {
                    name: req.user.nome_usuario,
                    email: req.user.email_usuario
                }
            })
        } else {
            res.json({ success: false })
        }
    })

    router.post('/Newsletter', async (req, res) => {
        const { nome, email } = req.body

        let erros = []

        const caracteresInvalidos = [    
            '!', '"', '#', '$', '%', '&', "'", '*', '+', ',', '-', '.', '/',
            ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '_', '`', '{', '|',
            '}', '~', '´', '¨', '¿', '¡','\n', '\r', '\t'
        ]

        const emailRegex = /^(?!.*\.\.)[a-zA-Z0-9._%+-]+(?<!\.)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
        const emailExistente = await NewsletterUsuario.findOne({ where: { email_usuario_newsletter: email } })

        for (let i = 0; i < nome.length; i++) {
            if (caracteresInvalidos.includes(nome[i])) {
                erros.push({mensagem: 'Nome inválido - Possui caracteres inválidos'})
            }
        }

         if (!emailRegex.test(email)) {
            erros.push({mensagem: 'Email inválido - Não possui o formato comum de um email'})
        }

        if (email.length > 254) {
            erros.push({mensagem: 'Email inválido - Maior que o possivel'})
        }

        if (emailExistente) {
            erros.push({mensagem: 'Email inválido - Email já está cadastrado'})
        }

        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {
            let novoUsuario = await NewsletterUsuario.create({
                nome_usuario_newsletter: nome,
                email_usuario_newsletter: email
            })

            res.status(200).json({ mensagem: 'Usuário cadastrado no Newsletter com sucesso'})
        }
    })


    // Perguntar se é importante armazenar no Banco de Dados e colocar pra responder na parte Administrativa
    router.post('/formContato', async (req, res) => {
        const { nome, email, telefone, mensagem } = req.body

        let erros = []

        const caracteresInvalidos = [    
            '!', '"', '#', '$', '%', '&', "'", '*', '+', ',', '-', '.', '/',
            ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '_', '`', '{', '|',
            '}', '~', '´', '¨', '¿', '¡','\n', '\r', '\t'
        ]

        const emailRegex = /^(?!.*\.\.)[a-zA-Z0-9._%+-]+(?<!\.)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/

        const telefoneLimpo = telefone.replace(/[()-]/g, "")

        const ddds = [
            "61", "62", "64", "65", "66", "67", "82", "71", "73", "74", "75", 
            "77", "85", "88", "98", "99", "83", "81", "87", "86", "89", "84", 
            "79", "68", "96", "92", "97", "91", "93", "94", "69", "95", "63",
            "27", "28", "31", "32", "33", "34", "35", "37", "38", "21", "22", 
            "24", "11", "12", "13", "14", "15", "16", "17", "18", "19", "41", 
            "42", "43", "44", "45", "46", "51", "53", "54", "55", "47", "48", "49"
        ]

        // --------------------------------------------------------------------------------------

        for (let i = 0; i < nome.length; i++) {
            if (caracteresInvalidos.includes(nome[i])) {
                erros.push({mensagem: 'Nome inválido - Possui caracteres inválidos'})
            }
        }

        if (!nome.trim()) {
            erros.push({ mensagem: 'Nome inválido - Não pode ter apenas espaços em brancos' });
        }

        if (!isNaN(nome)) {
            erros.push({mensagem: 'Assunto inválido - Não pode ser apenas números'});
        }

        if (!emailRegex.test(email)) {
            erros.push({mensagem: 'Email inválido - Não possui o formato comum de um email'})
        }

        if (email.length > 254) {
            erros.push({mensagem: 'Email inválido - Maior que o possivel'})
        }

        if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
            erros.push({mensagem: 'Telefone inválido - Telefone muito curto'})
        }

        if (!ddds.includes(telefoneLimpo.slice(0, 2))) {
            erros.push({mensagem: 'Telefone inválido - DDD inválido'})
        }

        if (!mensagem.trim()) {
            erros.push({ mensagem: 'A mensagem não pode conter apenas espaços' })
        }

        if (!isNaN(mensagem)) {
            erros.push({mensagem: 'Mensagem inválida - Não pode ser apenas números'});
        }

        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {
            const enviarContato = () => {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'testetccrebites@gmail.com',
                        pass: 'dzzp ylul mejo avzr' // Ver o ngc da senha
                    }
                })
             
                const corpoEmail = `${nome} | ${email} | ${telefone}\n${mensagem}`
                     
                const mailOptions = {
                    from: 'testetccrebites@gmail.com',
                    to: 'testetccrebites@gmail.com',
                    subject: 'Contato',
                    text: corpoEmail
                }
             
                return transporter.sendMail(mailOptions)
            }
             
            await enviarContato()

            res.status(200).json({ mensagem: 'Mensagem enviada com sucesso'})
        }
    })

module.exports = router