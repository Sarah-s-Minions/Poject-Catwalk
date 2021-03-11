import React, { useEffect, useState } from 'react';
import axios from 'axios';
import header from '../../../../config.js';
import SortForm from './SortForm.jsx';
import ReviewsList from './ReviewsList.jsx';
import PostReviewForm from './PostReviewForm.jsx';
import Ratings from './Ratings/Ratings.jsx';
import Search from './Search.jsx';
import Modal from 'react-modal';

const Reviews = (props) => {
  const [characteristicsArr, setCharacteristicsArr] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [alteredArray, setAlteredArray] = useState([]);
  const [amountOfReviews, addReviews] = useState(2);
  const [sortParameters] = useState(['relevance', 'newest', 'helpful']);
  const [selectedParameter, updateParam] = useState('relevance');
  const [isPosting, togglePosting] = useState(false);
  const [isDisplayingMoreReviewsButton, setIsdisplayingMoreReviewsButton] = useState(false);



  useEffect(() => {
    if (props.currentProduct) {
      getReviews();
    }
  }, [selectedParameter, props.currentProduct]);
  useEffect(() => {
    updateMoreReviewsButton(reviews);
  }, [amountOfReviews])

  useEffect(() => {
    filterAndSearchReviews(reviews);
    if (props.metadata.characteristics) {
      splitCharacteristics()
    }
  }, [searchQuery, filters, props.metadata]);

  const splitCharacteristics = () => {
    let arrOfChars = [];
    Object.keys(props.metadata.characteristics).map((key) => {
      arrOfChars.push([key, props.metadata.characteristics[key]]);
    });
    setCharacteristicsArr(arrOfChars);
  };

  const addFilters = (filterToAdd) => {
    let updatedFilters = filters.map((element) => element);
    updatedFilters.push(filterToAdd);
    setFilters(updatedFilters);
  };
  const removeFilters = (filterToRemove) => {
    let updatedFilters = [];
    filters.map((element) => {
      if (element !== filterToRemove) {
        updatedFilters.push(element);
      }
    });
    setFilters(updatedFilters);
  };

  const manipulateFilters = (filter) => {
    if (filters.includes(filter)) {
      removeFilters(filter);
    } else {
      addFilters(filter);
    }
  };

  const filterReviews = (untouchedReviews) => {
    let filteredReviews = [];
    untouchedReviews.filter((review) => {
      if (filters.includes(review.rating)) {
        filteredReviews.push(review);
      }
    });
    if (filteredReviews.length === 0) {
      return [];
    }
    return filteredReviews;
  };

  const addMoreReviews = () => {
    addReviews(amountOfReviews + 2);
  };

  const updateParamFunc = (e) => {
    updateParam(e.target.value);
  };

  const getReviews = () => {
    let id = props.currentProduct;
    axios.get(`http://127.0.0.1:3000/api/reviews/?product_id=${id}&count=100&sort=${selectedParameter}`)
      .then((data) => {
        setReviews(data.data.results);
        updateMoreReviewsButton(data.data.results);
        props.getRatings();
      })
      .catch((err) => console.log(err));
  };

  const filterAndSearchReviews = (arrayToSearch) => {
    if (filters.length > 0 && searchQuery.length > 2) {
      let searchedAndFiltered = filterReviews(arrayToSearch);
      return searchReviews(searchQuery, searchedAndFiltered);
    }

    if (filters.length > 0) {
      return setAlteredArray(filterReviews(arrayToSearch));
    }
    if (searchQuery.length > 2) {
      return searchReviews(searchQuery, reviews);
    }
  };

  const searchReviews = (input, arrToSearch) => {
    input = input.toLowerCase();
    let searchReviews = [];
    arrToSearch.filter((review) => {
      if (review.body.toLowerCase().includes(input) || review.summary.toLowerCase().includes(input)) {
        searchReviews.push(review);
      }
    });
    setAlteredArray(searchReviews);
  };

  let lengthOfReviews;
  if (!reviews) {
    lengthOfReviews = 0;
  } else {
    lengthOfReviews = reviews.length;
  }
  let addReviewsButton;
  let moreReviewsButton;
  if (!isDisplayingMoreReviewsButton) {
    addReviewsButton = <div  ><button style={{marginLeft: '2%'}} id="addMore" onClick={(e) => {
      e.preventDefault()
      togglePostForm()
    }} >ADD A REVIEW +</button></div>
    moreReviewsButton = '';
  } else {
    addReviewsButton = '';
    moreReviewsButton = <div><button className="review-buttons" onClick={addMoreReviews} >MORE REVIEWS</button><button className="review-buttons" onClick={(e) => {
      e.preventDefault()
      togglePostForm()
    }} >ADD A REVIEW +</button></div>
  }

  const updateMoreReviewsButton = (arrOfReviews) => {
    if (arrOfReviews.length > 2) {
      setIsdisplayingMoreReviewsButton(true);
    }
    if (amountOfReviews >= arrOfReviews.length) {
      setIsdisplayingMoreReviewsButton(false);
    }
  };

  const togglePostForm = () => {
    togglePosting(!isPosting);
  };

  let postForm;
  if (!isPosting) {
    postForm = '';
  } else {
    postForm = <PostReviewForm togglePostForm={togglePostForm} characteristicsArr={characteristicsArr} getReviews={getReviews} review_id={props.currentProduct} />;
  }

  let filterDisplay;
  if (filters.length > 1) {
    let filterString = `Now displaying ${alteredArray.length} items with `;
    filters.forEach((e => filterString += ` ${e} star,`));
    filterString = filterString.slice(0, -1);
    filterString += ' ratings.';
    filterDisplay = (
      <div id="filter-display" ><div style={{marginTop: '2%'}}>{filterString}</div>
        <button id="addMore"  onClick={() => { setFilters([]) }} >Remove all rating filters</button>
      </div>
    );
  } else {
    filterDisplay = '';
  }

  return (
    <div widget={props.widget} className="ratings-reviews">
      {postForm}
          <Ratings
            characteristicsArr={characteristicsArr}
            manipulateFilters={manipulateFilters}
            avgRating={props.avgRating}
            metadata={props.metadata}/>
        <div className="reviews" >
          <div className="sort-bar">
            {`${lengthOfReviews} reviews, sorted by`}
            <SortForm updateParamFunc={updateParamFunc} sortParameters={sortParameters} />
            {addReviewsButton}
            <Search
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchReviews={searchReviews}
            />
          </div>

          {filterDisplay}
          {searchQuery.length > 2 || filters.length > 0
            ? <ReviewsList avgRating={props.avgRating}
                getReviews={getReviews}
                reviews={alteredArray}
                amountOfReviews={amountOfReviews}
                characteristicsArr={characteristicsArr}
                searchQuery={searchQuery}
                />
            : <ReviewsList avgRating={props.avgRating}
                getReviews={getReviews}
                reviews={reviews}
                amountOfReviews={amountOfReviews}
                characteristicsArr={characteristicsArr}
                searchQuery={searchQuery}
                />}
          <div className="more-reviews-bar">
            {moreReviewsButton}
          </div>
        </div>
      </div>
  );
};

export default Reviews;
