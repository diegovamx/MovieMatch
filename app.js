import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js'
import { getDatabase, push, ref, onValue, query, remove, equalTo, orderByChild } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js'

const firebaseConfig = {
    databaseURL: "https://movie-match-b03f3-default-rtdb.firebaseio.com/"
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)
const moviesRef = ref(database, 'movies')

const searchInput = document.getElementById('search-input')
const searchForm = document.getElementById('search')
const moviesList = document.getElementById('movies-list')
const watchlist = document.getElementById('watchlist')
const watchlistContainer = document.getElementById('watchlist-container')


onValue(moviesRef, (snapshot) => { 
    const snapshotDoesExist = snapshot.exists()
    if (snapshotDoesExist) {
        const snapshotValues = snapshot.val()
        const existingMovies = Object.values(snapshotValues)
        renderWatchlist(existingMovies)
    } else {
        watchlistContainer.innerHTML = "<h2 id='empty-text'>No movies added yet.</h2>"
    }
}
)

searchForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const searchTerm = searchInput.value;
    fetch(`https://api.themoviedb.org/3/search/movie?query=${searchTerm}&api_key=978cbead576c10d9c54fc8cc80b36700`,
    {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
        }
    })
    .then(response => response.json())
    .then(data => {renderMovies(data)})
}
)

function renderMovies(movies) {
    moviesList.innerHTML = ""
            if (movies.results.length === 0) {
                moviesList.innerHTML = "<h2>No results found</h2>"
            }
            movies.results.slice(0,20).forEach(movie => {
                if (!movie.poster_path) {
                    return
                }
                const movieItem = document.createElement('li')
                movieItem.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
                <h2>${movie.title}</h2>
                `
                moviesList.appendChild(movieItem)
            })
}

moviesList.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG') {
        const movieTitle = e.target.nextElementSibling.innerText
        const moviePosterPath = e.target.getAttribute('src')
        const movieData = {
            title: movieTitle,
            poster_path: moviePosterPath
        }
        const newMovieRef = push(moviesRef, movieData)
        
        onValue(moviesRef, (snapshot) => { 
            const snapshotDoesExist = snapshot.exists()
            if (snapshotDoesExist) {
                const snapshotValues = snapshot.val()
                const existingMovies = Object.values(snapshotValues)
                renderWatchlist(existingMovies)
            } else {
                watchlistContainer.innerHTML = "<h2 id='empty-text'>No movies added yet.</h2>"
            }
        }
        )
    }

})




function renderWatchlist(selectedMovies) {
    watchlist.innerHTML = ""
        selectedMovies.forEach(selectedMovie => {
            const watchlistItem = document.createElement('li')
            watchlistItem.innerHTML = `

            <img src="https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}" alt="${selectedMovie.title}">
            <h2>${selectedMovie.title}</h2>
                
            `
        watchlist.appendChild(watchlistItem)
    })
}        

watchlist.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG') {
        const watchlistTitle = e.target.nextElementSibling.innerText;
        const moviesQuery = query(moviesRef, orderByChild('title'), equalTo(watchlistTitle));

        onValue(moviesQuery, (snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const movieKey = childSnapshot.key;
                    remove(ref(database, `movies/${movieKey}`));
                });
            } else {
                console.log("No movie found with the title: " + watchlistTitle);
            }
        }, {
            onlyOnce: true
        });
    }
})


