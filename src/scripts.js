/* eslint-disable max-len */
import "./styles/index.scss";
// import "./styles.css";
import Ingredient from "./classes/Ingredient.js";
import Cookbook from "./classes/Cookbook.js";
import Recipe from "./classes/Recipe.js";
import User from "./classes/User.js";
import { fetchUsers, fetchIngredients, fetchRecipes } from "./apiCalls.js";
import domUpdates from "./domUpdates.js";

/* QUERY SELECTORS */

// const recipeTitle = document.querySelector("#openRecipe");
const homePage = document.querySelector(".home-page");
const recipeView = document.querySelector(".recipe-view");
const homeButton = document.querySelector(".home-button");
const favoriteRecipesPageButton = document.querySelector(
  ".favorite-recipes-page-button"
);
const recipesToCookButton = document.querySelector(".recipes-to-cook-button");
const recipeCard = document.querySelector(".recipe-card");
// const filterBar = document.querySelector(".filter-bar");
const nameSearchInput = document.querySelector("#nameSearchInput");
const ingredientSearchInput = document.querySelector("#ingredientSearchInput");
const tagsDropDown = document.querySelector("#tags");
const favoriteRecipePage = document.querySelector(".favorite-recipe-page");
// const favoriteButtons = document.querySelectorAll(".favorite-button");
const recipesToCookPage = document.querySelector(".recipes-to-cook-page");
const userName = document.querySelector(".user-name");

/* GLOBAL VARIABLES */
const hidableElements = [
  homePage,
  recipeView,
  homeButton,
  favoriteRecipesPageButton,
  favoriteRecipePage,
  recipesToCookPage,
  recipesToCookButton,
];
let user;
let ingredients;
let recipes;
let cookbook;
let usersData;
let ingredientsData;
let recipesData;
let randomUser;

/* FUNCTIONS */
// domUpdates.hide(elementsToDisplay);
function displayElements(elementsToDisplay) {
  elementsToDisplay.forEach(removeHidden);
  hidableElements
    .filter((element) => !elementsToDisplay.includes(element))
    .forEach(addHidden);
}

function loadAPIs() {
  Promise.all([fetchUsers(), fetchIngredients(), fetchRecipes()]).then(
    (data) => {
      usersData = data[0];
      ingredientsData = data[1];
      recipesData = data[2];
      randomUser = Math.floor(Math.random() * usersData.length);
      user = new User(usersData[randomUser]);
      domUpdates.userGreeting(user);
      recipes = recipesData.map(
        ({ id, image, ingredients, instructions, name, tags }) => {
          const ingredientObjects = ingredients.map(({ id, quantity }) => {
            const { name, estimatedCostInCents } = ingredientsData.find(
              (ingredientData) => ingredientData.id === id
            );
            return new Ingredient({ id, name, estimatedCostInCents, quantity });
          });
          return new Recipe(
            id,
            image,
            ingredientObjects,
            instructions,
            name,
            tags
          );
        }
      );
      cookbook = new Cookbook(recipes);
      // REPLACE WITH DOMUPDATES
      renderRecipePages();
    }
  );
}

function getCookbookRecipes() {
  if (nameSearchInput.value || ingredientSearchInput.value) {
    const ingredientInput = ingredientSearchInput.value;
    const nameInput = nameSearchInput.value;
    return cookbook.filteredRecipes(ingredientInput, nameInput);
  } else if (tagsDropDown.value !== "none") {
    const tagInput = tagsDropDown.value;
    //written this way in case we want to try multiple tags at once in future. Should still work with dropdown
    return cookbook.filterTags(tagInput.split(",").map((tag) => tag.trim()));
  } else {
    return cookbook.recipes;
  }
}

function getUserRecipes() {
  if (nameSearchInput.value || ingredientSearchInput.value) {
    const ingredientInput = ingredientSearchInput.value;
    const nameInput = nameSearchInput.value;
    return user.filterByNameAndIngredient(nameInput, ingredientInput);
  } else if (tagsDropDown.value !== "none") {
    const tagInput = tagsDropDown.value;
    return user.filterTags(tagInput.split(",").map((tag) => tag.trim()));
  } else {
    return user.favoriteRecipes;
  }
}

function getRecipesToCook() {
  return user.recipesToCook;
}

function renderRecipePages() {
  populateRecipes(homePage, getCookbookRecipes);
  populateRecipes(favoriteRecipePage, getUserRecipes);
  populateRecipes(recipesToCookPage, getRecipesToCook);
}

function searchRecipes() {
  tagsDropDown.value = "none";
  renderRecipePages();
}

function filterByTags() {
  nameSearchInput.value = "";
  ingredientSearchInput.value = "";
  renderRecipePages();
}
function displayRecipeView(selectedRecipe) {
  // domUpdates.show(recipeView, homeButton, favoriteRecipesPageButton, recipesToCookButton)
  displayElements([
    recipeView,
    homeButton,
    favoriteRecipesPageButton,
    recipesToCookButton,
  ]);
  showRecipeCard(selectedRecipe);
}

function returnHome() {
  displayElements([homePage, favoriteRecipesPageButton, recipesToCookButton]);
  renderRecipePages();
}
// REPLACE WITH DOMUPDATES
function populateRecipes(element, getRecipes) {
  const recipes = getRecipes();
  element.innerHTML = recipes
    .map((recipe) => {
      const isFavorite = user.favoriteRecipes.includes(recipe);
      return `
      <article class="recipe-card recipe-title" data-recipe-id='${recipe.id}'>
        <img class="recipe-image" data-recipe-id='${recipe.id}' src="${
        recipe.image
      }" alt="Image of ${recipe.name}" width=400>
        <h1 class="recipe-title" data-recipe-id="${recipe.id}">${
        recipe.name
      }</h1>
        <div>
          <button class="fav-button-${recipe.id}">${
        isFavorite ? "Remove from " : "Add to "
      }Favorites</button>
          <p data-recipe-id="${recipe.id}">Tags: ${recipe.tags.join(", ")}</p>
        </div>
      </article>`;
    })
    .join("");
  element.querySelectorAll(".recipe-card").forEach((recipeCard) => {
    recipeCard.addEventListener("click", (event) => {
      const recipeId = parseInt(event.target.dataset.recipeId);

      const selectedRecipe = recipes.find(({ id }) => id === recipeId);
      if (selectedRecipe) {
        displayRecipeView(selectedRecipe);
      }
    });
  });
  recipes.forEach((recipe) => {
    const favButton = element.querySelectorAll(`.fav-button-${recipe.id}`);
    favButton.forEach((button) => {
      button.addEventListener("click", clickFavoriteButton(recipe));
    });
  });
}
// REPLACE WITH DOMUPDATES
function showRecipeCard(selectedRecipe) {
  const isFavorite = user.favoriteRecipes.includes(selectedRecipe);
  const inRecipesToCook = user.recipesToCook.includes(selectedRecipe);
  let neededRecipesDisplay = "";
      //for DOMUPDATES: the thing that changes the paragraph tag that changes if we have the ingr or not
  if(user.checkPantry(selectedRecipe)){
   neededRecipesDisplay = `<p>You're ready to cook!</p>`
    //post to remove igr from our pantry when we click the button to cook it
    //logic for disabling button to  buy ingred
  } else {
  const neededIngredients = user.returnNeededIngredients(selectedRecipe)
    neededRecipesDisplay = neededIngredients.map(ingredient => {
      return `<p>${ingredient}</p>`
    }).join("")
    //forEach ===> post call? buy ingrButton (cannot click the button to cook until then; once bought then it can be selected to cook )
    //run return needed ingred method
    //returns array of needed ingr
  }

  recipeView.innerHTML = `
    <div>
      <img class="recipe-image" id="" src="${selectedRecipe.image}" alt="${
    selectedRecipe.name
  }">
      <button class="favorite-button">${
        isFavorite ? "Unf" : "F"
      }avorite</button>
      <button class="add-to-recipes-to-cook-button" ${
        inRecipesToCook ? "disabled" : ""
      }>${
    inRecipesToCook ? "Already in List" : "Add to Recipes to Cook"
  }</button>
    <button class="cook-recipe-button" ${user.checkPantry(selectedRecipe) ? "" : "disabled"}>Cook Recipe </button>
    <button class="buy-ingredients-button" ${user.checkPantry(selectedRecipe) ? "disabled" : ""}>Buy Ingredients </button>
    </div>
    <section class="recipe-info">
      <div>
        <h1 class="recipe-title">${selectedRecipe.name}</h1>
      </div>
      <div>
      <h1 class="">Ingredients</h1>
      <ul>
      ${selectedRecipe.ingredients
        .map(({ name, amount, unit }) => {
          return `<li>${amount} ${unit} ${name}</li>`;
        })
        .join("")}
      </ul>
      </div>
      <div>
        <h3>Total Cost of Ingredients: $${(
          selectedRecipe.getCostOfIngredients() / 100
        ).toFixed(2)}</h3>
      </div>
      <div class="needed-ingredients"> ${neededRecipesDisplay}
      </div>
      <div>
        <h1 class="">Recipe Instructions</h1>
        ${selectedRecipe.instructions
          .map(({ number, instruction }) => {
            return `<p>${number}. ${instruction}</p>`;
          })
          .join("")}
      </div>
      </section>`;
  document.querySelectorAll(".favorite-button").forEach((button) => {
    button.addEventListener("click", () => {
      clickFavoriteButton(selectedRecipe)();
      showRecipeCard(selectedRecipe);
    });
  });

  document
    .querySelector(".add-to-recipes-to-cook-button")
    .addEventListener("click", () => {
      user.addRecipesToCook(selectedRecipe);
      // REPLACE WITH DOMUPDATES
      renderRecipePages();
      showRecipeCard(selectedRecipe);
    });
}
// REPLACE WITH DOMUPDATES?
function showFavoritesPage() {
  displayElements([favoriteRecipePage, homeButton, recipesToCookButton]);
  renderRecipePages();
}

// REPLACE WITH DOMUPDATES?
function showRecipesToCookPage() {
  displayElements([recipesToCookPage, homeButton, favoriteRecipesPageButton]);
  renderRecipePages();
}

function clickFavoriteButton(recipe) {
  return () => {
    const isFavorite = user.favoriteRecipes.includes(recipe);
    if (isFavorite) {
      user.removeRecipeFromFavorites(recipe);
    } else {
      user.addFavoriteRecipe(recipe);
    }
    renderRecipePages();
  };
}

function addHidden(element) {
  element.classList.add("hidden");
}

function removeHidden(element) {
  element.classList.remove("hidden");
}

/* Event Listeners */
window.addEventListener("load", loadAPIs);
homeButton.addEventListener("click", returnHome);
tagsDropDown.addEventListener("change", filterByTags);
recipesToCookButton.addEventListener("click", showRecipesToCookPage);
favoriteRecipesPageButton.addEventListener("click", showFavoritesPage);
nameSearchInput.addEventListener("input", searchRecipes);
ingredientSearchInput.addEventListener("input", searchRecipes);
