function recipesApp() {
    return {
        recipes: [],
        filteredRecipes: [],
        categories: [],
        loading: true,
        showRecipeDetails: false,
        selectedRecipe: null,
        searchOpen: false,
        mobileMenuOpen: false,
        currentStep: 0,
        error: null,
        loadedImages: {},
        imageObserver: null,
        filters: {
            search: '',
            category: '',
            time: '',
            difficulty: []
        },
        
        init() {
            this.loading = true;
            
            this.setupIntersectionObserver();
            
            fetch('data.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Impossible de charger le data.json');
                    }
                    return response.json();
                })
                .then(data => {
                    
                    const recipes = data.recipes || data;
                    
                    if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
                        console.error('Le format des données est incorrect ou vide');
                        throw new Error('Format de données incorrect');
                    }
                    
                    this.recipes = recipes.map(recipe => {
                        return {
                            id: recipe.id,
                            name: recipe.title || "Sans titre",
                            imageUrl: recipe.imageUrl || "/api/placeholder/400/300",
                            thumbnailUrl: "/api/placeholder/100/100",
                            description: "Recette de " + (recipe.title || "Sans titre"),
                            category: recipe.category || "Non catégorisé",
                            preparationTime: recipe.preparationTime || 0,
                            difficulty: this.capitalizeDifficulty(recipe.difficulty || "facile"),
                            servings: recipe.servings || 1,
                            ingredients: (recipe.ingredients || []).map(ing => {
                                if (ing && ing.name && ing.quantity && ing.unit) {
                                    return `${ing.quantity} ${ing.unit} de ${ing.name}`;
                                }
                                return "Ingrédient non spécifié";
                            }),
                            instructions: recipe.instructions || [],
                        };
                    });
                    
                    this.recipes.forEach(recipe => {
                        this.loadedImages[recipe.id] = false;
                    });
                    
                    this.categories = [...new Set(this.recipes.map(recipe => recipe.category))];
                    
                    this.filterRecipes();
                    
                    this.loading = false;
                    
                    this.$nextTick(() => {
                        this.observeImages();
                    });
                })
                .catch(error => {
                    console.error('Erreur lors du chargement des recettes:', error);
                    
                    this.error = "Erreur lors du chargement des recettes";
                    
                    this.loading = false;
                });
                
            window.addEventListener('click', (e) => {
                if (this.mobileMenuOpen && !e.target.closest('nav')) {
                    this.mobileMenuOpen = false;
                }
            });
        },
        
        setupIntersectionObserver() {
            const options = {
                root: null, 
                rootMargin: '0px 0px 200px 0px', 
                threshold: 0.1 
            };
            
            if ('IntersectionObserver' in window) {
                this.imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const recipeId = entry.target.dataset.recipeId;
                            if (recipeId && !this.loadedImages[recipeId]) {
                                this.loadImage(recipeId);
                            }
                            observer.unobserve(entry.target);
                        }
                    });
                }, options);
            }
        },
        
        observeImages() {

            if (this.imageObserver) {
                document.querySelectorAll('.lazy-image-container').forEach(container => {
                    this.imageObserver.observe(container);
                });
            }
        },
        
        capitalizeDifficulty(difficulty) {
            if (!difficulty) return '';
            return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        },
        
        filterRecipes() {
            this.filteredRecipes = this.recipes.filter(recipe => {
                if (this.filters.search) {
                    const searchTerm = this.filters.search.toLowerCase();
                    const nameMatch = recipe.name.toLowerCase().includes(searchTerm);
                    const ingredientsMatch = recipe.ingredients.some(ingredient => 
                        ingredient.toLowerCase().includes(searchTerm)
                    );
                    if (!nameMatch && !ingredientsMatch) return false;
                }
                
                if (this.filters.category && recipe.category !== this.filters.category) return false;
                
                if (this.filters.time && recipe.preparationTime > parseInt(this.filters.time)) return false;
                
                if (this.filters.difficulty.length > 0 && !this.filters.difficulty.includes(recipe.difficulty)) return false;
                
                return true;
            });
            
            this.$nextTick(() => {
                this.observeImages();
            });
        },
        
        resetFilters() {
            this.filters = {
                search: '',
                category: '',
                time: '',
                difficulty: []
            };
            this.filterRecipes();
        },
        
        loadImage(recipeId) {
            if (!this.loadedImages[recipeId]) {
                this.loadedImages[recipeId] = true;
            }
        },
        
        getImageUrl(recipe) {
            if (this.loadedImages[recipe.id]) {
                return recipe.imageUrl;
            } else {
                return recipe.thumbnailUrl;
            }
        },
        
        openRecipeDetails(recipe) {
            this.loadImage(recipe.id);
            this.selectedRecipe = recipe;
            this.currentStep = 0;
            this.showRecipeDetails = true;
        },
        
        closeRecipeDetails() {
            this.showRecipeDetails = false;
            this.selectedRecipe = null;
            this.currentStep = 0;
        }
    }
}