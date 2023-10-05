import * as React from 'react';
import { connect } from 'react-redux';
import Card from '@mui/material/Card';
import { Link, useNavigate } from 'react-router-dom';

// MUI Components
import { CardActionArea } from '@mui/material';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
// Files
import imagePlaceholder from '../images/no-image-icon.png';

function MediaCard(props) {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    navigate(`/ads/${props.ad._id}`);
  };

  // Auction status based on the ad-details
  const updateAuctionStatus = (ad) => {
    if (ad.sold) {
      return 'Sold';
    } else if (ad.auctionEnded) {
      return 'Ended, not-sold';
    } else if (!ad.auctionStarted) {
      return 'Upcoming';
    } else {
      return 'Ongoing';
    }
  };

  return (
    <a
      onClick={(e) => {
        handleCardClick(e);
      }}
      style={{ textDecoration: 'none' }}
    >
      <Card style={props.cardStyle}>
        <CardActionArea>
          {!props.dashCard && (
            <CardMedia
              component='img'
              height='180'
              src={props.ad.image ? props.ad.image : imagePlaceholder}
              alt='green iguana'
            />
          )}
          <CardContent>
            <Typography gutterBottom variant='h6' component='div'>
              {props.ad.productName}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Price: $20
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Remaining: 60 seconds
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Status: In Progress
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </a>
  );
}

const mapStateToProps = (state) => ({
  adDetails: state.ad.adDetails,
});

// export default connect(mapStateToProps, {
//   loadAdDetails,
//   loadAdImage,
//   setImageLoadingStatus,
// })(MediaCard);
export default MediaCard;
