import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  categories: [],
  banners: [],
  featuredProducts: [],
  flashSale: [],
  frozenProducts: [],
  exclusiveOffers: [],
  trendingProducts: [],
  newLaunch: [],
  todaysDeals: [],
  categorySections: [],
  loading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    setBanners: (state, action) => {
      state.banners = action.payload;
    },
    setHomeCollections: (state, action) => {
      state.flashSale = action.payload.flashSale || [];
      state.frozenProducts = action.payload.frozenProducts || [];
      state.exclusiveOffers = action.payload.exclusiveOffers || [];
      state.trendingProducts = action.payload.trendingProducts || [];
      state.newLaunch = action.payload.newLaunch || [];
      state.todaysDeals = action.payload.todaysDeals || [];
    },
    setFeaturedProducts: (state, action) => {
      state.featuredProducts = action.payload;
    },
    setCategorySections: (state, action) => {
      state.categorySections = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { 
  setCategories, 
  setBanners, 
  setHomeCollections, 
  setFeaturedProducts,
  setCategorySections,
  setLoading, 
  setError 
} = productSlice.actions;

export default productSlice.reducer;
