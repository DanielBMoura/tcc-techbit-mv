document.addEventListener('DOMContentLoaded', function(){
    // Carrossel
    const sliders = document.querySelectorAll('.slider');
    const btnVoltar = document.getElementById('voltar-button');
    const btnPassar = document.getElementById('passar-button');

    let currentSlide = 0;
    let intervalId; // Variável para armazenar o ID do intervalo

    function hideSliders() {
        sliders.forEach(item => item.classList.remove('on'));
    }

    function showSlider() {
        sliders[currentSlide].classList.add('on');
    }

    function nextSlide() {
        hideSliders();
        currentSlide = (currentSlide + 1) % sliders.length;
        showSlider();
    }

    function previousSlide() {
        hideSliders();
        currentSlide = (currentSlide - 1 + sliders.length) % sliders.length;
        showSlider();
    }

    function startSliderInterval() {
        intervalId = setInterval(nextSlide, 4000); // Muda para o próximo slide a cada 6 segundos
    }

    if (btnVoltar && btnPassar) {
        btnVoltar.addEventListener('click', () => {
            previousSlide();
            clearInterval(intervalId); // Limpa o intervalo para evitar mudanças automáticas enquanto o usuário interage
            startSliderInterval(); // Reinicia o intervalo após a interação do usuário
        });

        btnPassar.addEventListener('click', () => {
            nextSlide();
            clearInterval(intervalId); // Limpa o intervalo para evitar mudanças automáticas enquanto o usuário interage
            startSliderInterval(); // Reinicia o intervalo após a interação do usuário
        });
    }

    if (sliders.length > 0) {
        showSlider();
        startSliderInterval();
    }
})

document.addEventListener('DOMContentLoaded', function(){
    // Responsividade Navbar
    window.openNav = function () {
        document.getElementById("mySidenav").style.width = "250px";
    }

    window.closeNav = function () {
        document.getElementById("mySidenav").style.width = "0";
    }
})

document.addEventListener('DOMContentLoaded', function(){
    //carrinho seção
    const carrinhoDiv = document.querySelector('.carrinho a');
    const carrinhoSection = document.getElementById('carrinho-section');
    const fecharCarrinhoButton = document.getElementById('fechar-carrinho');

    carrinhoDiv.addEventListener('click', function(event) {
        event.preventDefault();
        carrinhoSection.style.display = 'block';
    });
        
    fecharCarrinhoButton.addEventListener('click', function() {
        carrinhoSection.style.display = 'none';
    })
})

document.addEventListener('DOMContentLoaded', function(){
    const input = document.getElementById('pesquisa_lupa');
    const closeBtn = document.getElementById('close-btn');
    const resultados = document.getElementById('resultados');

    document.getElementById('lupa').addEventListener('click', function(event) {
        event.preventDefault();

        input.style.display = 'block';
        closeBtn.style.display = 'block';
        resultados.style.display = 'none';
        input.focus();
    });

    document.getElementById('close-btn').addEventListener('click', function() {

        input.style.display = 'none';
        closeBtn.style.display = 'none';
        resultados.style.display = 'none';
        
        input.value = ''
    })

    let debounceTimeout;
    input.addEventListener('input', function() {
        clearTimeout(debounceTimeout);
        const query = this.value.trim();

        if (query.length > 0) {
            debounceTimeout = setTimeout(() => realizarBusca(query), 300);
        } else {
            resultados.style.display = 'none';
        }
    });

    function realizarBusca(query) {
        fetch(`/buscar?query=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    exibirResultados(data)
                })
                .catch(error => console.error("Erro ao realizar a busca:", error))
    }

    function exibirResultados(data) {
        
        const resultadosContainer = document.getElementById("resultados");
        resultadosContainer.innerHTML = "";
    
        if (data.length === 0) {
            resultadosContainer.innerHTML = `
            <div id="nenhum-resultado">
                <p>Nenhum resultado encontrado.</p>
            </div>
            `

        resultadosContainer.style.display = 'block'

        return
        } else {
            data.forEach(item => {
                const div = document.createElement("div");
                div.classList.add("resultado-item");

                let nome = item.nome_produto || item.nome_subCategoria || item.nome_categoria

                let imagemHTML = ""
    
                let link = "#"

                let span = ""

                if (item.nome_produto) {

                    let imagens = [];
                    
                    imagens = JSON.parse(item.imagens_produto);

                    const imagemSrc = imagens[0]

                    imagemHTML = `<img src="${imagemSrc}" alt="${nome}">`

                    span = "Produto"

                    link = `/Produtos/${item.subcategoria.categoria.slug_categoria}/${item.subcategoria.slug_subCategoria}/${item.slug_produto}`
                
                } else if (item.imagem_subCategoria) {
                
                    const imagemSrc = item.imagem_subCategoria
                    imagemHTML = `<img src="${imagemSrc}" alt="${nome}">`

                    span = "SubCategoria"

                    link = `/Produtos/${item.categoria.slug_categoria}/${item.slug_subCategoria}`
                } else if (item.nome_categoria) {
                    const imagemSrc = item.imagem_categoria
                    imagemHTML = `<img src="${imagemSrc}" alt="${nome}">`

                    span = "Categoria"

                    link = `/Produtos/${item.slug_categoria}`
                }
    
                div.innerHTML = `
                    <a href="${link}">
                        ${imagemHTML}
                        <div class="resultado-texto">
                            <span class="resultado-nome">${nome}</span>
                            <span class="resultado-tipo">${span}</span>
                        </div>
                    </a>
                `
    
                resultadosContainer.appendChild(div);
            })

            resultadosContainer.style.display = 'block'
        }
    }

    // Código adicionado, se a lupa parar de funcionar::

    const profilePic = document.getElementById('profile-pic');
    const profileBox = document.getElementById('profile-box');
    
    // Adiciona o evento de clique
    profilePic.addEventListener('click', function() {
        // Alterna a visibilidade da profile-box
        if (profileBox.style.display === 'none') {
            profileBox.style.display = 'block';
        } else {
            profileBox.style.display = 'none';
        }
    });

    document.addEventListener('click', function(event) {
        // Se o clique não foi na imagem do perfil nem dentro da profile-box
        if (event.target !== profilePic && !profileBox.contains(event.target)) {
            profileBox.style.display = 'none';
        }
    })

    fetch('/UsuariosPerfil', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.user) {
                document.getElementById('user-name').textContent = data.user.name
                document.getElementById('user-email').textContent = data.user.email
            }
        })
        .catch(error => {
            console.error('Erro ao buscar dados do usuário:', error);
        })

    document.getElementById("formNewsletter").addEventListener("submit", async function (event) {
            event.preventDefault();
            
            let mensagemErroSucesso = document.getElementById('mensagem')
            let nome = document.getElementById('nome')
            let email = document.getElementById('email')

            const formData = new FormData(event.target)
            const formObject = {}

            formData.forEach((value, key) => {
                formObject[key] = value
            })

            const response = await fetch('/Newsletter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formObject),
            })

            const data = await response.json()

            if (!response.ok) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ""
                }, 3000)
            } else {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    event.target.reset()
                    mensagemErroSucesso.textContent = ""
                }, 3000)
            }
    })
    
})

document.addEventListener('DOMContentLoaded', function() {

    const adicionarCarrinhoBtn = document.getElementById('adicionarCarrinhoBtn');
    const mensagemErroSucesso = document.getElementById('mensagem');
    const form = document.getElementById('addToCartForm');

    // Zoom nos produtos individuais
    const box = document.getElementById("imageProd");
    const img = document.getElementById("imageProd1");

    box.addEventListener("mousemove", (e) => {
        const x = e.clientX - e.target.offsetLeft;
        const y = e.clientY - e.target.offsetTop;

        img.style.transformOrigin = `${x}px ${y}px`;
        img.style.transform = "scale(1.5)";
    });

    box.addEventListener("mouseleave", () => {
        img.style.transformOrigin = "center center";
        img.style.transform = "scale(1)";
    });

    window.trocarImagem = function(src) {
        document.getElementById('imageProd1').src = src; // Atualiza o src da imagem principal
    }

    async function verificarAutenticacao() {
        return fetch('/Verificar-Autenticacao', {
            method: 'POST',  // Antes era GET, agora está correto
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => data.autenticado) // Retorna true ou false
        .catch(error => {
            console.error('Erro ao verificar autenticação:', error);
            return false; // Assume que não está autenticado em caso de erro
        });
    }

    adicionarCarrinhoBtn.addEventListener('click', async function(event) {
        event.preventDefault();  // Impede o envio padrão do formulário

        const autenticado = await verificarAutenticacao()

        if (!autenticado) {
            mensagemErroSucesso.textContent = 'Usuário não autenticado. Faça login para adicionar produtos no carrinho';
            setTimeout(() => {
                mensagemErroSucesso.textContent = '';
            }, 3000);
        } else {
            document.getElementById('quantidadeModal').style.display = 'block';
        }
    });

    document.getElementById('confirmarQuantidade').addEventListener('click', function() {
        let quantidade = document.getElementById('quantidade').value;
        if (quantidade && quantidade > 0) {
            // Definir o valor da quantidade no campo escondido
            document.getElementById('quantidade_produto').value = quantidade;

            // Enviar os dados via fetch para a API
            const formData = new FormData(form);
            const formObject = {};
            formData.forEach((value, key) => {
                formObject[key] = value;
            });

            fetch('/Adicionar-Ao-Carrinho', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formObject),  // Envia os dados como JSON
            })
            .then(response => response.json())  // Converte a resposta para JSON
            .then(data => {
                if (data.mensagem) {
                    mensagemErroSucesso.textContent = data.mensagem;
                    setTimeout(() => {
                        mensagemErroSucesso.textContent = ''; // Limpa a mensagem após 3 segundos
                        document.getElementById('quantidade').value = '';
                    }, 3000);
                }
                if (data.reload) {
                    setTimeout(() => {
                        location.reload();
                    }, 3000)
                }
            })
            .catch(error => {
                console.log('Erro:', error);
            });

            // Fechar o modal após o envio do formulário
            document.getElementById('quantidadeModal').style.display = 'none';

        } else {
            mensagemErroSucesso.textContent = 'Insira uma quantidade válida';
            setTimeout(() => {
                mensagemErroSucesso.textContent = ''; // Limpa a mensagem após 3 segundos
            }, 3000);
        }
    });

    document.getElementById('cancelarQuantidade').addEventListener('click', function() {
        // Fechar o modal se o usuário cancelar
        document.getElementById('quantidadeModal').style.display = 'none';
        document.getElementById('quantidade').value = '';
    });

});

document.addEventListener('DOMContentLoaded', function(){
    const fileInput = document.getElementById("imagem");
    const uploadButton = document.getElementById("uploadButton");
    const previewImage = document.getElementById("preview-image");
        
    uploadButton.addEventListener("click", () => {
        fileInput.click(); // Abre o seletor de arquivo quando o botão é clicado
    });
        
    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewImage.style.display = "block";
            };
            reader.readAsDataURL(file);
        }
    });
})






document.addEventListener('DOMContentLoaded', function() {
    let selectedFiles = []

    document.getElementById("botaoUpload").addEventListener("click", function() {
        document.getElementById("imagens").click()
    })

    document.getElementById("imagens").addEventListener("change", function(event) {
        const previewContainer = document.getElementById("preview-container-img")
        
        Array.from(event.target.files).forEach(file => {
            if (selectedFiles.length < 3) {
                selectedFiles.push(file)
                
                const imgWrapper = document.createElement("div")
                imgWrapper.style.display = "inline-block"
                imgWrapper.style.position = "relative"
                imgWrapper.style.marginRight = "10px"
                
                const img = document.createElement("img")
                img.src = URL.createObjectURL(file)
                img.style.maxWidth = "150px"
                img.style.display = "block"
                
                const removeButton = document.createElement("button")
                removeButton.innerText = "Remover"
                removeButton.style.display = "block"
                removeButton.style.marginTop = "5px"
                removeButton.addEventListener("click", function() {
                    const index = selectedFiles.indexOf(file)
                    if (index > -1) {
                        selectedFiles.splice(index, 1)
                    }
                    imgWrapper.remove()
                    updateFileList()
                })
                
                imgWrapper.appendChild(img)
                imgWrapper.appendChild(removeButton)
                previewContainer.appendChild(imgWrapper)
            }
        })

        updateFileList()
    })

    function updateFileList() {
        const dataTransfer = new DataTransfer()
        selectedFiles.forEach(file => dataTransfer.items.add(file))
        document.getElementById("imagens").files = dataTransfer.files
    }
})


document.addEventListener('DOMContentLoaded', function(){
    var campoSenha = document.getElementById("campoSenha");
    var campoConfirmarSenha = document.getElementById("campoConfirmarSenha");
    var botaoMostrarSenha = document.getElementById("botaoMostrarSenha");

    function mostrarSenha() {    
        // Verifica se o checkbox foi marcado
        if (botaoMostrarSenha.checked) {
            // Muda o tipo do input para texto
            campoSenha.type = "text";
            campoConfirmarSenha.type = "text"
        } else {
            // Muda o tipo do input para senha novamente
            campoSenha.type = "password";
            campoConfirmarSenha.type = "password"
        }
    }
    
    botaoMostrarSenha.addEventListener("change", mostrarSenha)

    function exibirMensagem(tipo, texto) {
        const msgContainer = document.getElementById('mensagem-container')
    
        // Criar o elemento de mensagem
        const mensagem = document.createElement('div')
        mensagem.className = `alert ${tipo === 'erro' ? 'alert-danger' : 'alert-success'}`
        mensagem.textContent = texto
    
        // Adiciona a mensagem ao container
        msgContainer.appendChild(mensagem)
    
        // Remove a mensagem após 5 segundos
        setTimeout(() => {
            mensagem.remove()
        }, 5000)
    }

    document.getElementById('login-form').addEventListener('submit', async function(event) {
        event.preventDefault() // Evita o reload da página
    
        const email = document.getElementById('email').value
        const senha = document.getElementById('campoSenha').value
    
        const resposta = await fetch('/login-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        })
    
        const dados = await resposta.json()
    
        if (resposta.ok) {
            exibirMensagem('sucesso', 'Login bem-sucedido!')
            setTimeout(() => {
                window.location.href = '/' // Redireciona após o sucesso
            }, 6000)
        } else {
            exibirMensagem('erro', dados.error)
        }
    })
})

document.addEventListener('DOMContentLoaded', function(){
    let mensagemErroSucesso = document.getElementById('mensagem')

    function formatarTelefone() {
        const telefoneInput = document.getElementById("telefone");
    
        if (telefoneInput) {
            telefoneInput.addEventListener("input", function () {
                
                let valor = telefoneInput.value.replace(/\D/g, "")
                
                if (valor.length > 0) {
                    valor = "(" + valor
                }
                
                if (valor.length > 3) {
                    valor = valor.slice(0, 3) + ")" + valor.slice(3);
                }
    
                if (valor.length > 8 && valor.length < 13) {
                    valor = valor.slice(0, 8) + "-" + valor.slice(8)
                }
                else if (valor.length >= 13) {
                    valor = valor.slice(0, 9) + "-" + valor.slice(9)
                }
    
                telefoneInput.value = valor
            })
        }
    }
    formatarTelefone()

    document.getElementById("cep").addEventListener("blur", function () {
        let cep = this.value.replace(/\D/g, "")
    
        if (cep.length == 8) {
            buscarCEP(cep)
        } else {
            mensagemErroSucesso.textContent = 'Não possui o formato de CEP'
            setTimeout(() => {
                mensagemErroSucesso.textContent = ''
            }, 3000)

            document.getElementById("rua").value = ''
            document.getElementById("bairro").value = ''
            document.getElementById("cidade").value = ''
            document.getElementById("uf").value = ''
        }
    })

    function buscarCEP(cep) {
        let url = `https://viacep.com.br/ws/${cep}/json/`
    
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (!data.erro) {
                    document.getElementById("rua").value = data.logradouro
                    document.getElementById("bairro").value = data.bairro
                    document.getElementById("cidade").value = data.localidade
                    document.getElementById("uf").value = data.uf
                } else {
                    mensagemErroSucesso.textContent = 'CEP não encontrado'
                    setTimeout(() => {
                        mensagemErroSucesso.textContent = ''
                    }, 3000)

                    document.getElementById("rua").value = ''
                    document.getElementById("bairro").value = ''
                    document.getElementById("cidade").value = ''
                    document.getElementById("uf").value = ''
                }
            })
    }

    window.formatarCEP = function(input) {
        let valor = input.value.replace(/\D/g, '')

        if (valor.length > 5) {
            valor = valor.slice(0, 5) + '-' + valor.slice(5, 8)
        }

        input.value = valor
    }
})

document.addEventListener("DOMContentLoaded", () => {    
    window.atualizarEstoque = function(id){
        const estoqueInput = document.getElementById(`estoque-${id}`)

        let estoqueAtual = parseInt(estoqueInput.value)

        if (isNaN(estoqueAtual) || estoqueAtual < 0) {
            estoqueInput.value = 0
            estoqueAtual = 0
        }

        const data = {
            id_produto: id,
            estoque_produto: estoqueAtual
        }

        fetch('/Admin/Produtos/AtualizarEstoque', {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
        .then((response) => response.json())
        .then((result) => {
            console.log('Sucesso ao enviar a atualização de estoque:', result)
        })
        .catch((error) => {
            console.error("Erro ao enviar a atualização de estoque:", error)
        })
    }
})

// -----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('cadastro-form').addEventListener('submit', function(event) {

        let mensagemErroSucesso = document.getElementById('mensagem')
    
        event.preventDefault()
        
        const formData = new FormData(event.target)
        const formObject = {}
    
        formData.forEach((value, key) => {
            formObject[key] = value;
        }) 
    
        fetch('/cadastro-form', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObject),
        }).then(response => response.json()).then(data => {
            if (data.mensagem) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ''
                }, 3000)
            }
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect
                }, 3000)
            }
        }).catch(error => {
            console.error('Erro:', error);
        })
    })
})

// ------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('produto-form').addEventListener('submit', function(event) {

        event.preventDefault()
    
        let mensagemErroSucesso = document.getElementById('mensagem')
    
        const imagem = document.getElementById('imagens').files.length
    
        if (imagem === 0) {
            event.preventDefault()
            mensagemErroSucesso.textContent = 'Carregue uma imagem para o produto.'
            setTimeout(() => {
                mensagemErroSucesso.textContent = ''
            }, 3000)
            return
        }
        
        const formData = new FormData(event.target)
    
        fetch('/Admin/Produtos/Novo', {
            method: 'POST',
            body: formData
        }).then(response => response.json()).then(data => {
            
            if (data.mensagem) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ''
                }, 3000)
            }
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect
                }, 3000)
            }
        }).catch(error => {
            console.log('Erro:' + error);
        })
    })
})

// ------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('editProduto-form').addEventListener('submit', function(event) {

        event.preventDefault()
    
        let mensagemErroSucesso = document.getElementById('mensagem')
        
        const formData = new FormData(event.target)
    
        fetch('/Admin/Produtos/Edit', {
            method: 'POST',
            body: formData
        }).then(response => response.json()).then(data => {
            
            if (data.mensagem) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ''
                }, 3000)
            }
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect
                }, 3000)
            }
        }).catch(error => {
            console.log('Erro:' + error)
        })
    })
})

// --------------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.deletarProduto-form').forEach(form => {
        form.addEventListener('submit', function (event) {
            event.preventDefault()

            let mensagemErroSucesso = document.getElementById('mensagem')

            const formData = new FormData(event.target)
            const formObject = {}

            formData.forEach((value, key) => {
                formObject[key] = value
            })

            fetch('/Admin/Produtos/Deletar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formObject),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.mensagem) {
                        mensagemErroSucesso.textContent = data.mensagem
                        setTimeout(() => {
                            mensagemErroSucesso.textContent = ''
                        }, 3000)
                    }
                    if (data.redirect) {
                        setTimeout(() => {
                            window.location.href = data.redirect
                        }, 3000)
                    }
                })
                .catch(error => {
                    console.log('Erro:' + error)
                })
        })
    })
})

// ------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('addCategoria-form').addEventListener('submit', function(event) {

        event.preventDefault()
    
        let mensagemErroSucesso = document.getElementById('mensagem')
    
        const imagem = document.getElementById('imagem').files.length
    
        if (imagem === 0) {
            event.preventDefault()
            mensagemErroSucesso.textContent = 'Carregue uma imagem para o produto.'
            setTimeout(() => {
                mensagemErroSucesso.textContent = ''
            }, 3000)
            return
        }
        
        const formData = new FormData(event.target)
    
        fetch('/Admin/Categorias/Novo', {
            method: 'POST',
            body: formData
        }).then(response => response.json()).then(data => {
            
            if (data.mensagem) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ''
                }, 3000)
            }
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect
                }, 3000)
            }
        }).catch(error => {
            console.log('Erro:' + error);
        })
    })
})

// ------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('editCategoria-form').addEventListener('submit', function(event) {

        event.preventDefault()
    
        let mensagemErroSucesso = document.getElementById('mensagem')
        
        const formData = new FormData(event.target)
    
        fetch('/Admin/Categorias/Editar', {
            method: 'POST',
            body: formData
        }).then(response => response.json()).then(data => {
            
            if (data.mensagem) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ''
                }, 3000)
            }
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect
                }, 3000)
            }
        }).catch(error => {
            console.log('Erro:' + error);
        })
    })
})

// -----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.deletarCategoria-form').forEach(form => {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            let mensagemErroSucesso = document.getElementById('mensagem');

            const formData = new FormData(event.target);
            const formObject = {};

            formData.forEach((value, key) => {
                formObject[key] = value;
            });

            fetch('/Admin/Categorias/Deletar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formObject),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.mensagem) {
                        mensagemErroSucesso.textContent = data.mensagem;
                        setTimeout(() => {
                            mensagemErroSucesso.textContent = '';
                        }, 3000);
                    }
                    if (data.redirect) {
                        setTimeout(() => {
                            window.location.href = data.redirect;
                        }, 3000);
                    }
                })
                .catch(error => {
                    console.error('Erro:', error);
                });
        });
    });
});

// -----------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('addSubCategoria-form').addEventListener('submit', function(event) {

        event.preventDefault()
    
        let mensagemErroSucesso = document.getElementById('mensagem')
    
        const imagem = document.getElementById('imagem').files.length
    
        if (imagem === 0) {
            event.preventDefault()
            mensagemErroSucesso.textContent = 'Carregue uma imagem para o produto.'
            setTimeout(() => {
                mensagemErroSucesso.textContent = ''
            }, 3000)
            return
        }
        
        const formData = new FormData(event.target)
    
        fetch('/Admin/SubCategorias/Novo', {
            method: 'POST',
            body: formData
        }).then(response => response.json()).then(data => {
            
            if (data.mensagem) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ''
                }, 3000)
            }
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect
                }, 3000)
            }
        }).catch(error => {
            console.log('Erro:' + error);
        })
    })
        const categoria = JSON.parse(localStorage.getItem('categoria'));
        if (categoria) {
            document.querySelector('input[name="id"]').value = categoria.id_categoria;
        }
})

// -------------------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('editSubCategoria-form').addEventListener('submit', function(event) {

        event.preventDefault()
    
        let mensagemErroSucesso = document.getElementById('mensagem')
        
        const formData = new FormData(event.target)
    
        fetch('/Admin/SubCategoria/Editar', {
            method: 'POST',
            body: formData
        }).then(response => response.json()).then(data => {
            
            if (data.mensagem) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ''
                }, 3000)
            }
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect
                }, 3000)
            }
        }).catch(error => {
            console.log('Erro:' + error);
        })
    })
})

// -----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('#deletarSubCategoria-form').forEach(form => {
        form.addEventListener('submit', function (event) {
            event.preventDefault()

            let mensagemErroSucesso = document.getElementById('mensagem')

            const formData = new FormData(event.target)
            const formObject = {}

            formData.forEach((value, key) => {
                formObject[key] = value
            })

            fetch('/Admin/SubCategorias/Deletar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formObject),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.mensagem) {
                        mensagemErroSucesso.textContent = data.mensagem
                        setTimeout(() => {
                            mensagemErroSucesso.textContent = ''
                        }, 3000)
                    }
                    if (data.redirect) {
                        setTimeout(() => {
                            window.location.href = data.redirect
                        }, 3000)
                    }
                })
                .catch(error => {
                    console.log('Erro:' + error)
                })
        })
    })
})


document.addEventListener('DOMContentLoaded', function () {
    function exibirMensagem(tipo, texto) {
        const msgContainer = document.getElementById('mensagem-container')
    
        // Criar o elemento de mensagem
        const mensagem = document.createElement('div')
        mensagem.className = `alert ${tipo === 'erro' ? 'alert-danger' : 'alert-success'}`
        mensagem.textContent = texto
    
        // Adiciona a mensagem ao container
        msgContainer.appendChild(mensagem)
    
        // Remove a mensagem após 5 segundos
        setTimeout(() => {
            mensagem.remove()
        }, 5000)
    }

    document.getElementById('logout-btn').addEventListener('click', async function() {
        const resposta = await fetch('/logout', { method: 'GET' });
        const dados = await resposta.json();
    
        if (resposta.ok) {
            exibirMensagem('sucesso', dados.message);
            setTimeout(() => {
                window.location.href = '/';
            }, 6000);
        } else {
            exibirMensagem('erro', dados.error);
        }
    })
})

document.addEventListener("DOMContentLoaded", function() {
    setTimeout(function() {
        let alerta = document.getElementById("alerta");
        if (alerta) {
            setTimeout(() => alerta.remove(), 500);
        }
    }, 5000);
});

document.addEventListener('DOMContentLoaded', function () {
    let selectedFiles = []
    const maxImages = 3

    document.getElementById("botaoUpload2").addEventListener("click", function() {
        document.getElementById("imagens").click()
    })

    document.getElementById("imagens").addEventListener("change", function(event) {
        const existingImages = document.querySelectorAll(".image-item").length

        Array.from(event.target.files).forEach(file => {
            if ((selectedFiles.length + existingImages) < maxImages) {
                selectedFiles.push(file)
            }
        })

        atualizarImagens()
        updateFileList()
    })

    // Função para remover imagens existentes (imagens mantidas)
    window.removerImagem = function(index) {
        const imagensMantidasInput = document.getElementById('imagens_mantidas')
        const imagensMantidas = JSON.parse(imagensMantidasInput.value)

        // Remove a imagem pela index e atualiza o input oculto
        imagensMantidas.splice(index, 1)
        imagensMantidasInput.value = JSON.stringify(imagensMantidas)

        atualizarImagens()
    }

    // Função para atualizar a visualização das imagens
    function atualizarImagens() {
        const previewContainer = document.getElementById("preview-container-img")
        previewContainer.innerHTML = ''

        // Exibe as imagens mantidas do servidor
        const imagensMantidasInput = document.getElementById('imagens_mantidas')
        const imagensMantidas = JSON.parse(imagensMantidasInput.value) || []

        imagensMantidas.forEach((imagem, index) => {
            const imgWrapper = document.createElement("div")
            imgWrapper.className = "image-item"
            imgWrapper.style.display = "inline-block"
            imgWrapper.style.position = "relative"
            imgWrapper.style.marginRight = "10px"

            imgWrapper.innerHTML = `
                <img src="${imagem}" style="max-width: 150px; display: block;">
                <button type="button" onclick="removerImagem(${index})">Remover</button>
            `
            previewContainer.appendChild(imgWrapper)
        })

        // Exibe as novas imagens selecionadas
        selectedFiles.forEach((file, index) => {
            const imgWrapper = document.createElement("div")
            imgWrapper.style.display = "inline-block"
            imgWrapper.style.position = "relative"
            imgWrapper.style.marginRight = "10px"

            const img = document.createElement("img")
            img.src = URL.createObjectURL(file)
            img.style.maxWidth = "150px"
            img.style.display = "block"

            const removeButton = document.createElement("button")
            removeButton.innerText = "Remover"
            removeButton.style.display = "block"
            removeButton.style.marginTop = "5px"

            removeButton.addEventListener("click", function() {
                selectedFiles.splice(index, 1)
                atualizarImagens()
                updateFileList()
            })

            imgWrapper.appendChild(img)
            imgWrapper.appendChild(removeButton)
            previewContainer.appendChild(imgWrapper)
        })
    }

    // Atualiza o input de arquivos com os arquivos selecionados
    function updateFileList() {
        const dataTransfer = new DataTransfer()
        selectedFiles.forEach(file => dataTransfer.items.add(file))
        document.getElementById("imagens").files = dataTransfer.files
    }
})

document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('categoriaBlog-form').addEventListener('submit', function(event) {

        let mensagemErroSucesso = document.getElementById('mensagem')
    
        event.preventDefault()
        
        const formData = new FormData(event.target)
        const formObject = {}
    
        formData.forEach((value, key) => {
            formObject[key] = value;
        }) 
    
        fetch('/Admin/CategoriasBlog/Novo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObject),
        }).then(response => response.json()).then(data => {
            if (data.mensagem) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ''
                }, 3000)
            }
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect
                }, 3000)
            }
        }).catch(error => {
            console.error('Erro:', error);
        })
    })
})


document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('editCategoriaBlog-form').addEventListener('submit', function(event) {

        let mensagemErroSucesso = document.getElementById('mensagem')
    
        event.preventDefault()
        
        const formData = new FormData(event.target)
        const formObject = {}
    
        formData.forEach((value, key) => {
            formObject[key] = value;
        }) 
    
        fetch('/Admin/CategoriasBlog/Editar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObject),
        }).then(response => response.json()).then(data => {
            if (data.mensagem) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ''
                }, 3000)
            }
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect
                }, 3000)
            }
        }).catch(error => {
            console.error('Erro:', error);
        })
    })
})

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('#deletarCategoriaBlog-form').forEach(form => {
        form.addEventListener('submit', function (event) {
            event.preventDefault()

            let mensagemErroSucesso = document.getElementById('mensagem')

            const formData = new FormData(event.target)
            const formObject = {}

            formData.forEach((value, key) => {
                formObject[key] = value
            })

            fetch('/Admin/CategoriasBlog/Deletar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formObject),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.mensagem) {
                        mensagemErroSucesso.textContent = data.mensagem
                        setTimeout(() => {
                            mensagemErroSucesso.textContent = ''
                        }, 3000)
                    }
                    if (data.redirect) {
                        setTimeout(() => {
                            window.location.href = data.redirect
                        }, 3000)
                    }
                })
                .catch(error => {
                    console.log('Erro:' + error)
                })
        })
    })
})


document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('postagemBlog-form').addEventListener('submit', function(event) {

        let mensagemErroSucesso = document.getElementById('mensagem')
    
        event.preventDefault()
        
        const formData = new FormData(event.target)
        const formObject = {}
    
        formData.forEach((value, key) => {
            formObject[key] = value;
        }) 
    
        fetch('/Admin/Postagens/Nova', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObject),
        }).then(response => response.json()).then(data => {
            if (data.mensagem) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ''
                }, 3000)
            }
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect
                }, 3000)
            }
        }).catch(error => {
            console.error('Erro:', error);
        })
    })
})

document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('editarPostagem-form').addEventListener('submit', function(event) {

        let mensagemErroSucesso = document.getElementById('mensagem')
    
        event.preventDefault()
        
        const formData = new FormData(event.target)
        const formObject = {}
    
        formData.forEach((value, key) => {
            formObject[key] = value;
        }) 
    
        fetch('/Admin/Postagens/Editar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObject),
        }).then(response => response.json()).then(data => {
            if (data.mensagem) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ''
                }, 3000)
            }
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect
                }, 3000)
            }
        }).catch(error => {
            console.error('Erro:', error);
        })
    })
})


document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('#deletarPostagem-form').forEach(form => {
        form.addEventListener('submit', function (event) {
            event.preventDefault()

            let mensagemErroSucesso = document.getElementById('mensagem')

            const formData = new FormData(event.target)
            const formObject = {}

            formData.forEach((value, key) => {
                formObject[key] = value
            })

            fetch('/Admin/Postagens/Deletar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formObject),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.mensagem) {
                        mensagemErroSucesso.textContent = data.mensagem
                        setTimeout(() => {
                            mensagemErroSucesso.textContent = ''
                        }, 3000)
                    }
                    if (data.redirect) {
                        setTimeout(() => {
                            window.location.href = data.redirect
                        }, 3000)
                    }
                })
                .catch(error => {
                    console.log('Erro:' + error)
                })
        })
    })
})
    

document.querySelectorAll(".deletarCarrinho-form").forEach(form => {
    form.addEventListener("submit", async function (event) {
        event.preventDefault(); // Evita o recarregamento da página
        
        let mensagemErroSucesso = document.getElementById('mensagem')

        const formData = new FormData(event.target)
        const formObject = {}

        formData.forEach((value, key) => {
            formObject[key] = value
        })

        fetch('/Excluir-Carrinho', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObject),
        })
        .then(response => response.json())
        .then(data => {
            if (data.mensagem) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ''
                }, 3000)
            }
            if (data.reload) {
                setTimeout(() => {
                    location.reload();
                }, 3000)
            }
        })
        .catch(error => {
            console.log('Erro:' + error)
        })
    });
});

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('#emailForm').forEach(form => {
        form.addEventListener('submit', function (event) {
            event.preventDefault()

            let mensagemErroSucesso = document.getElementById('mensagem')

            const formData = new FormData(event.target)
            const formObject = {}

            formData.forEach((value, key) => {
                formObject[key] = value
            })

            fetch('/Enviar-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formObject),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.mensagem) {
                        mensagemErroSucesso.textContent = data.mensagem
                        setTimeout(() => {
                            mensagemErroSucesso.textContent = ''
                        }, 3000)
                    }
                    if (data.redirect) {
                        setTimeout(() => {
                            window.location.href = data.redirect
                        }, 3000)
                    }
                })
                .catch(error => {
                    console.log('Erro:' + error)
                })
        })
    })
})


document.addEventListener('DOMContentLoaded', function () { 
    const btnResponder = document.getElementById('btnResponder')
    const formulario = document.getElementById('formulario-resposta')
    const enviarButton = document.getElementById('enviarButton')
    const fecharButton = document.getElementById('fecharButton')
    
    btnResponder.addEventListener('click', () => {
      formulario.style.display = 'block'
      btnResponder.style.display = 'none'
    })

    fecharButton.addEventListener('click', () => {
        formulario.style.display = 'none'
        btnResponder.style.display = 'block'
        
        document.getElementById('mensagemEmail').value = ''
    })

    document.querySelectorAll('#respostaEmail').forEach(form => {
        form.addEventListener('submit', function (event) {
            event.preventDefault()

            let mensagemErroSucesso = document.getElementById('mensagem')

            const formData = new FormData(event.target)
            const formObject = {}

            formData.forEach((value, key) => {
                formObject[key] = value
            })

            fetch('/Admin/Orcamentos/Email-Responder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formObject),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.mensagem) {
                        mensagemErroSucesso.textContent = data.mensagem
                        setTimeout(() => {
                            mensagemErroSucesso.textContent = ''
                        }, 3000)
                    }
                    if (data.redirect) {
                        setTimeout(() => {
                            window.location.href = data.redirect
                        }, 3000)
                    }
                })
                .catch(error => {
                    console.log('Erro:' + error)
                })
        })
    })
})

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.btn-cancelar-orcamento').forEach(button => {
        button.addEventListener('click', function () {
            const num_orcamento = this.getAttribute('data-id')
            let mensagemErroSucesso = document.getElementById('mensagem')

            fetch('/Admin/CancelarOrcamento', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ num_orcamento: num_orcamento })
            })
            .then(response => response.json())
            .then(data => {
                if (data.mensagem) {
                    mensagemErroSucesso.textContent = data.mensagem
                    setTimeout(() => {
                        mensagemErroSucesso.textContent = ''
                    }, 3000)
                }
                if (data.redirect) {
                    setTimeout(() => {
                        window.location.href = data.redirect
                    }, 3000)
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao processar a solicitação');
            })
        })
    })
})

document.addEventListener('DOMContentLoaded', function (){
    document.querySelector('.btn-finalizar').addEventListener('click', function() {
        document.getElementById('CaixaValor').style.display = 'block'
    })

    document.getElementById('cancelarValor').addEventListener('click', function() {
        document.getElementById('CaixaValor').style.display = 'none'
    })

    document.getElementById('valor').addEventListener('input', function(e) {
        // Remove tudo que não é dígito ou vírgula
        let value = this.value.replace(/\D/g, '').replace(/^0+/g, '');
        
        // Se o campo estiver vazio, define como 0
        if (value.length === 0) {
            this.value = '';
            return;
        }
        
        // Adiciona os zeros necessários para os centavos
        while (value.length < 3) {
            value = '0' + value;
        }
        
        // Insere a vírgula antes dos 2 últimos dígitos
        value = value.replace(/^(\d+)(\d{2})$/, '$1,$2');
        
        // Adiciona pontos para separar milhares
        value = value.replace(/(\d)(?=(\d{3})+\,)/g, '$1.');
        
        // Adiciona o R$
        this.value = 'R$ ' + value;
    });
})

document.querySelectorAll(".formFinalizarOrcamento").forEach(form => {
    form.addEventListener("submit", async function (event) {
        event.preventDefault()

        const valorFormatado = document.getElementById('valor').value
        const valorNumerico = parseFloat(
            valorFormatado.replace(/R\$\s?|\./g, '').replace(',', '.')
        )

        if (isNaN(valorNumerico) || valorNumerico <= 0) {
            console.log('Por favor, insira um valor válido')
            return
        }
        
        let mensagemErroSucesso = document.getElementById('mensagem')

        const formData = new FormData(event.target)
        const formObject = {}

        formData.forEach((value, key) => {
            formObject[key] = value
        })
        formObject.valor = valorNumerico

        fetch('/Admin/Finalizar-Orcamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObject),
        })
        .then(response => response.json())
        .then(data => {
            if (data.mensagem) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ''
                }, 3000)
            }
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect
                }, 3000)
            }
        })
        .catch(error => {
            console.log('Erro:' + error)
        })
    });
});

document.querySelectorAll("#formAtualizarStatus").forEach(form => {
    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        
        let mensagemErroSucesso = document.getElementById('mensagem')

        const formData = new FormData(event.target)
        const formObject = {}

        formData.forEach((value, key) => {
            formObject[key] = value
        })

        fetch('/Admin/atualizar-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObject),
        })
        .then(response => response.json())
        .then(data => {
            if (data.mensagem) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ''
                }, 3000)
            }
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect
                }, 3000)
            }
        })
        .catch(error => {
            console.log('Erro:' + error)
        })
    });
})

document.addEventListener('DOMContentLoaded', function(){ 

    document.getElementById("formNewsletterAdmin").addEventListener("submit", async function (event) {
        event.preventDefault();
            
        let mensagemErroSucesso = document.getElementById('mensagem')

        const formData = new FormData(event.target)
        const formObject = {}

        formData.forEach((value, key) => {
            formObject[key] = value
        })

        fetch('/Admin/Newsletter/Emails-Newsletter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObject),
        })
        .then(response => response.json())
        .then(data => {
            if (data.mensagem) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ''
                }, 3000)
            }
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect
                }, 3000)
            }
        })
        .catch(error => {
            console.log('Erro:' + error)
        })
    });

})

// Se tiver algum erro no javascript, ver por que isso foi adicionado
document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('btnVerUsuarios').addEventListener('click', async function() {
        const listaDiv = document.getElementById('listaUsuarios')
        const buttonFechar = document.getElementById('btnFecharUsuarios')

        listaDiv.style.display = 'block'
        buttonFechar.style.display = 'block'
    })

    document.getElementById('btnFecharUsuarios').addEventListener('click', async function() {
        const listaDiv = document.getElementById('listaUsuarios')
        const buttonFechar = document.getElementById('btnFecharUsuarios')

        listaDiv.style.display = 'none'
        buttonFechar.style.display = 'none'
    })
})

// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('cadastroAdm-form').addEventListener('submit', function(event) {

        let mensagemErroSucesso = document.getElementById('mensagem')
    
        event.preventDefault()
        
        const formData = new FormData(event.target)
        const formObject = {}
    
        formData.forEach((value, key) => {
            formObject[key] = value;
        }) 
    
        fetch('/Admin/cadastroAdm-form', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObject),
        }).then(response => response.json()).then(data => {
            if (data.mensagem) {
                mensagemErroSucesso.textContent = data.mensagem
                setTimeout(() => {
                    mensagemErroSucesso.textContent = ''
                }, 3000)
            }
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect
                }, 3000)
            }
        }).catch(error => {
            console.error('Erro:', error);
        })
    })
})

//-------------------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('formContato').addEventListener('submit', async function(event) {
        event.preventDefault()

        let mensagemErroSucesso = document.getElementById('mensagem')
        
        const formData = new FormData(event.target)
        const formObject = {}
    
        formData.forEach((value, key) => {
            formObject[key] = value;
        }) 
    
        const response = await fetch('/formContato', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObject),
        })

        const data = await response.json()

        if (!response.ok) {
            mensagemErroSucesso.textContent = data.mensagem
            setTimeout(() => {
                mensagemErroSucesso.textContent = ''
            }, 3000)
        } else {
            mensagemErroSucesso.textContent = data.mensagem
            setTimeout(() => {
                event.target.reset()
                mensagemErroSucesso.textContent = ''
            }, 3000)
        }
    })
})

// ------------------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function(){

    const input = document.getElementById('searchInput')
    const button = document.getElementById('searchButton')
    const resultados = document.getElementById('resultadosAdmin');
    
    let debounceTimeout;

    function realizarBusca(query) {
        fetch(`/Admin/buscar?query=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    exibirResultados(data)
                })
                .catch(error => console.error("Erro ao realizar a busca:", error))
    }

    input.addEventListener('input', function() {
        clearTimeout(debounceTimeout);
        const query = this.value.trim()

        if (query.length > 0) {
            debounceTimeout = setTimeout(() => realizarBusca(query), 300);
        } else {
            resultados.style.display = 'none';
        }
    });
})