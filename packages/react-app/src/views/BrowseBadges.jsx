// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react'
import externalContracts from '../contracts/external_contracts'
import { getAllRewards } from '../helpers/getAllRewards'

import { ethers } from 'ethers'
import InputLabel from '@mui/material/InputLabel'
import SearchIcon from '@mui/icons-material/Search'
import IconButton from '@mui/material/IconButton'
import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft'
import multihash from 'multihashes'
import { CircularProgress, InputAdornment, OutlinedInput, Typography } from '@mui/material'
import Box from '@mui/material/Box'
import { Paper } from '@mui/material'
import { FormControl } from '@mui/material'
import { useContext } from 'react'
import { BadgeContext } from 'contexts/BadgeContext'
import BadgesPaginatedSection from 'components/BadgesPaginatedSection'

export const toHex = ipfsHash => {
  let buf = multihash.fromB58String(ipfsHash)
  return '0x' + multihash.toHexString(buf)
}

export const toBase58 = contentHash => {
  let hex = contentHash.substring(2)
  let buf = multihash.fromHexString(hex)
  return multihash.toB58String(buf)
}

export const isHexadecimal = value => {
  return /^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0
}

export default function BrowseBadges() {
  const [badges, setBadges] = useState([])
  const [eventBadges, setEventBadges] = useState([])
  const [error, setErrorMessage] = useState('')
  const { localProvider, mainnet, address, setAddress, injectedProvider, selectedChainId, checkForWeb3Provider } =
    useContext(BadgeContext)

  let contractRef
  let providerRef
  let etherscanRef
  if (
    externalContracts[selectedChainId] &&
    externalContracts[selectedChainId].contracts &&
    externalContracts[selectedChainId].contracts.REMIX_REWARD
  ) {
    contractRef = externalContracts[selectedChainId].contracts.REMIX_REWARD
    providerRef = externalContracts[selectedChainId].provider
    etherscanRef = externalContracts[selectedChainId].etherscan
  }

  useEffect(() => {
    const run = async () => {
      if (!contractRef) return setErrorMessage('chain not supported. ' + selectedChainId)
      if (!address) {
        setBadges([])
        setErrorMessage('')
        return
      }
      setErrorMessage('')
      try {
        let contract = new ethers.Contract(contractRef.address, contractRef.abi, localProvider)
        const balance = await contract.balanceOf(address)
        const badges = []
        for (let k = 0; k < balance; k++) {
          try {
            const tokenId = await contract.tokenOfOwnerByIndex(address, k)
            const tId = tokenId.toHexString()
            let data = await contract.tokensData(tokenId)
            const found = eventBadges.find(x => ethers.utils.hexStripZeros(x.id) === ethers.utils.hexStripZeros(tId))
            // eslint-disable-next-line no-undef
            const badge = Object.assign({}, { transactionHash: found.transactionHash }, data, {
              decodedIpfsHash: toBase58(data.hash),
            })
            // console.log({ badge })
            badges.push(badge)
          } catch (e) {
            console.error(e)
          }
        }
        setBadges(badges)
        setErrorMessage('')
      } catch (e) {
        setErrorMessage(e.message)
      }
    }
    run()
  }, [address, contractRef, eventBadges, localProvider, selectedChainId])

  const run = useCallback(async () => {
    if (address) {
      return setEventBadges([])
    }
    let badges = await getAllRewards(contractRef.address, providerRef)
    // console.log({ badges })
    badges = badges.map(badge => {
      return {
        id: ethers.utils.hexStripZeros(badge.topics[3]),
        to: ethers.utils.hexZeroPad(ethers.utils.hexStripZeros(badge.topics[2]), 20),
        transactionHash: badge.transactionHash,
      }
    })
    setEventBadges(badges)
  }, [address, contractRef.address, providerRef])

  useEffect(() => {
    if (address.length > 0) return
    run()
  }, [address, run])

  function checkeventBagesAndBadges(badges) {
    return badges && badges.length > 0
  }

  async function processAddress(address) {
    setEventBadges([])
    let contract = new ethers.Contract(contractRef.address, contractRef.abi, localProvider)
    console.log({ contract }, 'contract created')
    const balance = await contract.balanceOf(address)
    console.log({ balance }, 'balance created')
    const badges = []
    console.log('badgesCreated')
    try {
      for (let k = 0; k < balance; k++) {
        const tokenId = await contract.tokenOfOwnerByIndex(address, k)
        badges.push({
          id: tokenId,
          to: ethers.utils.hexZeroPad(ethers.utils.hexStripZeros(address), 20),
          transactionHash: '',
        })
      }
    } catch (error) {
      console.log(error)
    }
    console.log('forEach finished. badges going to be set')
    setEventBadges(badges)
    console.log('badges set and done')
  }

  async function submitHandler(e) {
    console.log('submitHandler for address search reached successfully@@!!')
    try {
      if (address) {
        if (address.includes('.eth')) {
          let resolvedAddress = await mainnet.resolveName(address)
          if (!resolvedAddress) {
            setErrorMessage(`Could not resolve this address ${address}`)
          }
          await processAddress(resolvedAddress)
        } else {
          await processAddress(address)
        }
      } else {
        setEventBadges([])
        setErrorMessage('')
        return
      }
    } catch (error) {
      setErrorMessage(error)
    }
  }
  return (
    <>
      <Box sx={{ paddingTop: '76px' }}>
        {/*
        ⚙️ Here is an example UI that displays and sets the purpose in your smart contract:
      */}
        <Box sx={{ textAlign: 'left', padding: '10px', color: '#007aa6', marginLeft: 5 }}>
          <Typography variant={'h3'} fontWeight={700} sx={{ marginBottom: 5 }} color={'black'} fontFamily={'Noah'}>
            Remix Rewards
          </Typography>
          <Box>
            <Typography variant="inherit" fontWeight={500} mb={3} sx={{ color: '#333333' }}>
              Remix Project rewards contributors, beta testers, and UX research participants with NFTs deployed on
              Optimism.
              <br />
              Remix Reward holders are able to mint a second “Remixer” user NFT badge to give to any other user of their
              choice.
              <br />
              This feature is a way to reward Remix contributors to help grow our user base into a larger and more
              genuine open source community of practice.
            </Typography>
            <Typography variant="inherit" fontWeight={500} sx={{ color: '#333333' }}>
              Remix Rewards are currently not transferable. This feature leaves open the possibility of granting holders
              proportional voting power to help the community decide on new features for the IDE and/or other issues
              governing the development of the Remix toolset at some point in the future.
            </Typography>
          </Box>
          <Box></Box>
        </Box>
        <Box mt={8}>
          <Typography variant={'h6'} fontWeight={700} fontFamily={'Noah'} mb={3} sx={{ color: '#333333' }}>
            Input a wallet address to see the Remix Rewards it holds:
          </Typography>
          <Box display={'flex'} justifyContent={'center'} alignItems={'center'}>
            {address.length > 0 ? (
              <IconButton onClick={() => setAddress('')} sx={{ color: '#81a6f7', ':hover': { color: '#1976d2' } }}>
                {/* {'Back to Badge Gallery'} */}
                <ArrowCircleLeftIcon fontSize="large" />
              </IconButton>
            ) : null}
            <FormControl sx={{ width: '50vw' }} variant="outlined">
              <InputLabel htmlFor="addressEnsSearch">Wallet Address</InputLabel>
              <OutlinedInput
                id="addressEnsSearch"
                sx={{ color: '#444444' }}
                label="Wallet Address..."
                onChange={e => {
                  setAddress(e.target.value)
                }}
                value={address}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton>{address.length > 3 && <SearchIcon />}</IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>
            {address.length > 3 && badges.length === 0 ? (
              <CircularProgress color="secondary" sx={{ marginLeft: 5 }} />
            ) : null}
          </Box>
          {error && error.length > 0 ? (
            <Paper>
              <Typography
                sx={{
                  color: 'red',
                  fontWeight: 700,
                }}
                p={3}
              >
                {error}
              </Typography>
            </Paper>
          ) : null}
        </Box>
      </Box>
      <BadgesPaginatedSection
        badges={badges}
        checkeventBagesAndBadges={checkeventBagesAndBadges}
        etherscanRef={etherscanRef}
        eventBadges={eventBadges}
        injectedProvider={injectedProvider}
        setBadges={setBadges}
        checkForWeb3Provider={checkForWeb3Provider}
      />
    </>
  )
}
