// Access elements
const elements = {
// 1. Access by ID
 searchInput: document.getElementById("search-input"),
 searchButton: document.getElementById("search-btn"),
 //QuerySelector (CSS selectors)
 clearSearchBtn: document.querySelector(".cds--search-close"), // The first
 rows: document.querySelectorAll(".cds--row"), // get a list of all that match
 bordered: document.querySelectorAll(".cds--row, .cds--grid"), // get a list of all that match
 //Elements List
 divs: document.getElementsByClassName("search-row cds--row"),
 svgs: document.getElementsByTagName("svg"),
 meta: document.getElementsByName("viewport"),

 categoriesLoading: document.getElementById("categories-loading"),
 categoriesContainer: document.getElementById("categories-container"),

}


// App State
const appState = {
    baseUrl: "https://www.themealdb.com/api/json/v1/1",
    activeCategory: null,
    categories: [],
}


const fetchMealsByCategory = async (category) => {
    try {
        
        const response = await fetch(`${appState.baseUrl}/filter.php?c=${category}`)
        const data = await response.json()
        return data.meals || []

    } catch (error) {
        
        console.log("There was an error", error)

    }
}



// Fetch data from the internet
const fetchCategories = () => {
    const response = fetch(`${appState.baseUrl}/categories.php`)
    
    // Called when success happens
    response
        .then(
            (resp) => {
                return resp.json()
            } 
        )
        .then(
            (data) => {
                appState.categories = data.categories
                renderCategories(appState.categories)
            }
        )
    // .catch(
    //     (reason) => {
    //        // catch error from above and do what you want
    //        console.log("This reason is for the reponse error ==>", reason) 
    //        return "HUlla balloo"
    //     }
    // )
    // .then(
    //     (xyz) => {
    //         console.log("The caught value is ", xyz)
    //     }
    // )

    // // If request fails
    // response.catch(
    //     (reason) => {

    //     }
    // )
}


// Create and render card element
const createCategoryCard = (category) => {
    const card = document.createElement("div")
    card.className = "category-card"
    card.dataset.category = category.strCategory
    
    const isActive = appState.activeCategory === category.strCategory
    if(isActive){
        card.classList.add("active")
    }

    card.innerHTML = `
    
        <img
            src="${category.strCategoryThumb}"
            alt="${category.strCategory}"
            class="category-card__image"
            loading="lazy"
        >

        <p class="category-card__name">${category.strCategory}</p>
    
    `

    return card

}


// render categories
const renderCategories = (categories) => {
    elements.categoriesLoading.classList.add("hidden")
    elements.categoriesContainer.classList.remove("hidden")
    elements.categoriesContainer.innerHTML = ""

    categories.forEach(category => {
        const card = createCategoryCard(category)
        elements.categoriesContainer.appendChild(card)
    });

}


// Load Categories
const loadCategories = () => {
    fetchCategories()
}

// App's entry point
const initApp = (e) => {
    loadCategories()
}


// Events
document.addEventListener("DOMContentLoaded", initApp);
