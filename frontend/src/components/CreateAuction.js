import React, { useState } from "react";
import { Box, Grid, TextField, Button, Paper, Modal, Backdrop, Typography } from "@mui/material";

import DutchAuctionFactory from '../abis/DutchAuctionFactory.json';
import TokenFactory from '../abis/TokenFactory.json';
import { 
    getDutchAuctionFactoryContract,
    getTokenFactoryContract,
    getTokenContract,
    decodeTransctionLogs,
   } from '../utils/contract';
import { modalStyle, modalContainterStyle } from "./css/createAuction";
import { useNavigate } from "react-router-dom";

const CreateAuctionModal = (props) => {
    const navigate = useNavigate()
    const { openModal, handleCloseModal } = props;
    const [formData, setFormData] = useState({
        tokenName: '',
        tokenTicker: '',
        tokenQty: '',
        startingPrice: '',
        discountRate: ''
    })
    const [enableDeployToken, setEnableDeployToken] = useState(false)

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    function resetFormData(){
        setFormData({
            tokenName: '',
            tokenTicker: '',
            tokenQty: '',
            startingPrice: '',
            discountRate: ''
        })
        setEnableDeployToken(false)
    }

    // Contract related functions
    const dutchAuctionFactoryContract = getDutchAuctionFactoryContract()
    const tokenFactoryContract = getTokenFactoryContract()

    async function deployToken(){
        const name = formData.tokenName
        const ticker = formData.tokenTicker
        const tokenQty = formData.tokenQty
        const deployTokenTX = await tokenFactoryContract.deployToken(name, ticker, tokenQty)
        const rc = await deployTokenTX.wait()
        const rcLogs = decodeTransctionLogs(TokenFactory, rc.logs)
        const tokenAdd = rcLogs[0].events.find(e => e.name === 'tokenAddress').value
        setEnableDeployToken(false)
        return tokenAdd
    }

    async function isTokenExist(name, ticker){
        const tokenCount = await tokenFactoryContract.tokenCount()
        const tokenCountInt = parseInt(tokenCount._hex)
        console.log(tokenCountInt)
        for (let i = 0; i < tokenCountInt; i++){
            const tokenAdd = await tokenFactoryContract.tokens(i)
            const tokenContract = getTokenContract(tokenAdd)
            const tokenName = await tokenContract.name()
            const tokenTicker = await tokenContract.symbol()
            if (tokenName === name && tokenTicker === ticker){
                return {'isExist': true, 'tokenAdd': tokenAdd}
            }
        }
        return {'isExist': false, 'tokenAdd': null}
    }

    async function createAuction(){
        const { tokenName, tokenTicker, tokenQty, startingPrice, discountRate } = formData
        const {isExist, tokenAdd} = await isTokenExist(tokenName, tokenTicker)
        if (!isExist){
            setEnableDeployToken(true)
            return
        }

        const deployAuctionTx = await dutchAuctionFactoryContract.deployAuction(tokenAdd, tokenQty, startingPrice, discountRate)
        const rc = await deployAuctionTx.wait()
        const rcLogs = decodeTransctionLogs(DutchAuctionFactory, rc.logs)
        const auctionAdd = rcLogs[0].events.find(e => e.name === 'auctionAddress').value
        
        const tokenContract = getTokenContract(tokenAdd)
        await tokenContract.approve(auctionAdd, tokenQty)
        handleCloseModal()
        resetFormData()
        navigate(`/auctions/${auctionAdd}`)
    }

    return (
        <Modal
            open={openModal}
            onClose={handleCloseModal}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            closeAfterTransition
            sx={modalContainterStyle}
        >
            <Paper sx={modalStyle}>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField
                        fullWidth
                        label="Token Name"
                        name="tokenName"
                        value={formData.tokenName}
                        onChange={handleFormChange}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                        fullWidth
                        label="Token Ticker"
                        name="tokenTicker"
                        value={formData.tokenTicker}
                        onChange={handleFormChange}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                        fullWidth
                        label="Token Quantity"
                        name="tokenQty"
                        type="number"
                        value={formData.tokenQty}
                        onChange={handleFormChange}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                        fullWidth
                        label="Starting Price"
                        name="startingPrice"
                        type="number"
                        value={formData.startingPrice}
                        onChange={handleFormChange}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                        fullWidth
                        label="Discount Rate"
                        name="discountRate"
                        type="number"
                        value={formData.discountRate}
                        onChange={handleFormChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="body2" color="red">
                            {!enableDeployToken ? '' : 'Token not found! Please deploy the token first!'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                        variant="contained"
                        color="primary"
                        sx={{float: 'right', marginLeft: '1rem'}}
                        onClick={createAuction}
                        >
                        Create Auction
                        </Button>
                        <Button
                        variant="contained"
                        color="warning"
                        disabled={!enableDeployToken}
                        sx={{float: 'right'}}
                        onClick={deployToken}
                        >
                        Deploy Token
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Modal>

    );
}

export default CreateAuctionModal;