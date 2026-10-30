const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';
const USERS_URL = 'https://jsonplaceholder.typicode.com/users';

// Referencias al DOM principales
const postsContainer = document.getElementById('posts-container');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');
const searchInput = document.getElementById('search-input');

// Referencias al DOM del Modal y Formulario
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const postModal = document.getElementById('post-modal');
const newPostForm = document.getElementById('new-post-form');
const newTitleInput = document.getElementById('new-title');
const newBodyInput = document.getElementById('new-body');

// Referencias al DOM del Modal de Usuario
const userModal = document.getElementById('user-modal');
const closeUserModalBtn = document.getElementById('close-user-modal-btn');
const userAvatar = document.getElementById('user-avatar');
const userIdField = document.getElementById('user-id');
const userNameField = document.getElementById('user-name');
const userUsernameField = document.getElementById('user-username');
const userEmailLink = document.getElementById('user-email');
const userPhoneField = document.getElementById('user-phone');
const userWebsiteLink = document.getElementById('user-website');

let allPosts = [];
let allUsers = [];
let lastFocusedCard = null;

/**
 * Inicializar aplicación cargando datos GET
 */
async function initApp() {
    showLoading(true);
    showError(false); // Corregido: Oculta el error al iniciar correctamente

    try {
        // Realizamos peticiones en paralelo usando Promise.all
        const [postsResponse, usersResponse] = await Promise.all([
            fetch(POSTS_URL),
            fetch(USERS_URL)
        ]);

        if (!postsResponse.ok || !usersResponse.ok) {
            throw new Error('Error al conectar con el servidor.');
        }

        const posts = await postsResponse.json();
        const users = await usersResponse.json();

        // Guardamos los usuarios para mostrar sus datos en la ventana flotante
        allUsers = users;

        // Mapeamos los posts para adjuntar el nombre del autor
        allPosts = posts.map(post => {
            const author = users.find(user => user.id === post.userId);
            return {
                ...post,
                authorName: author ? author.name : 'Usuario Desconocido'
            };
        });

        // Renderizamos las tarjetas en el DOM
        renderPosts(allPosts);

    } catch (error) {
        console.error('Hubo un problema:', error);
        showError(true);
    } finally {
        showLoading(false);
    }
}

/**
 * Escapar texto para insertarlo de forma segura con innerHTML
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Renderizar tarjetas en el DOM
 */
function renderPosts(postsToRender) {
    if (postsToRender.length === 0) {
        postsContainer.innerHTML = `<p class="no-results" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No se encontraron publicaciones.</p>`;
        return;
    }

    // Cada tarjeta guarda el id del usuario (data-user-id) y es accesible con teclado
    const postsHTML = postsToRender.map(post => `
        <article class="post-card" data-user-id="${post.userId}" tabindex="0" role="button" aria-label="Ver los datos del autor de esta publicación">
            <div>
                <h2 class="post-title">${escapeHTML(post.title)}</h2>
                <p class="post-body">${escapeHTML(post.body)}</p>
            </div>
            <div class="post-footer">
                <span class="post-author">✍️ ${escapeHTML(post.authorName)}</span>
                <span class="post-hint">Ver datos del autor</span>
            </div>
        </article>
    `).join('');

    postsContainer.innerHTML = postsHTML;
}

/**
 * Funciones genéricas para abrir y cerrar ventanas flotantes
 */
function openModal(modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function closeModal(modal) {
    modal.classList.add('hidden');

    // Solo se libera el scroll de la página si no queda ninguna ventana abierta
    if (document.querySelectorAll('.modal:not(.hidden)').length === 0) {
        document.body.classList.remove('modal-open');
    }
}

/**
 * Manejo del Modal de Nueva Publicación (Abrir y Cerrar)
 */
openModalBtn.addEventListener('click', () => {
    openModal(postModal);
    newTitleInput.focus();
});

closeModalBtn.addEventListener('click', () => {
    closeModal(postModal);
});

/**
 * Ventana flotante con los datos del usuario
 */
function getInitials(name) {
    // Ignora tratamientos como "Mrs." y toma las iniciales de las dos primeras palabras
    return name
        .split(' ')
        .filter(word => !word.endsWith('.'))
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();
}

function showUserModal(userId) {
    // Los datos salen de la lista que se descargó del endpoint /users
    const user = allUsers.find(u => u.id === userId);

    if (!user) {
        alert('No se encontró la información de este usuario.');
        return;
    }

    userAvatar.textContent = getInitials(user.name);
    userIdField.textContent = user.id;
    userNameField.textContent = user.name;
    userUsernameField.textContent = user.username;
    userEmailLink.textContent = user.email;
    userEmailLink.href = `mailto:${user.email}`;
    userPhoneField.textContent = user.phone;
    userWebsiteLink.textContent = user.website;
    userWebsiteLink.href = `https://${user.website}`;

    openModal(userModal);
    closeUserModalBtn.focus();
}

function closeUserModal() {
    closeModal(userModal);

    // Devolvemos el foco a la tarjeta que abrió la ventana
    if (lastFocusedCard) {
        lastFocusedCard.focus();
    }
}

function handleCardActivation(card) {
    lastFocusedCard = card;
    showUserModal(Number(card.dataset.userId));
}

// Delegación de eventos: un solo listener atiende todas las tarjetas
postsContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.post-card');
    if (card) handleCardActivation(card);
});

// Accesibilidad: abrir la ventana con Enter o Espacio
postsContainer.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;

    const card = e.target.closest('.post-card');
    if (card) {
        e.preventDefault();
        handleCardActivation(card);
    }
});

closeUserModalBtn.addEventListener('click', closeUserModal);

// Cerrar si se hace clic fuera del contenido del modal
window.addEventListener('click', (e) => {
    if (e.target === postModal) {
        closeModal(postModal);
    }
    if (e.target === userModal) {
        closeUserModal();
    }
});

// Cerrar con la tecla Escape
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    if (!userModal.classList.contains('hidden')) {
        closeUserModal();
    } else if (!postModal.classList.contains('hidden')) {
        closeModal(postModal);
    }
});

/**
 * Enviar Nueva Publicación mediante Petición POST
 */
newPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = newTitleInput.value.trim();
    const body = newBodyInput.value.trim();

    if (!title || !body) return;

    const newPostPayload = {
        title: title,
        body: body,
        userId: 1 // Simulamos que el usuario actual tiene ID 1
    };

    try {
        const response = await fetch(POSTS_URL, {
            method: 'POST',
            body: JSON.stringify(newPostPayload),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        });

        if (!response.ok) {
            throw new Error('Error al registrar la publicación en el servidor.');
        }

        const createdPost = await response.json();
        createdPost.userId = newPostPayload.userId; // Vinculamos el post con el usuario 1
        createdPost.authorName = 'Tú (Autor Actual)';

        // Insertamos el nuevo post al inicio del arreglo global
        allPosts.unshift(createdPost);

        // Volvemos a renderizar la interfaz
        renderPosts(allPosts);

        // Limpiamos formulario y cerramos modal
        newPostForm.reset();
        closeModal(postModal);

        alert('¡Publicación creada exitosamente!');

    } catch (error) {
        console.error('Error al enviar POST:', error);
        alert('No se pudo crear la publicación. Inténtalo de nuevo.');
    }
});

/**
 * Buscador en tiempo real
 */
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();

    const filteredPosts = allPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm) || 
        post.body.toLowerCase().includes(searchTerm)
    );

    renderPosts(filteredPosts);
});

// Funciones auxiliares de UI (Control de estados)
function showLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.classList.remove('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

function showError(hasError) {
    if (hasError) {
        errorMessage.classList.remove('hidden');
    } else {
        errorMessage.classList.add('hidden');
    }
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', initApp);
