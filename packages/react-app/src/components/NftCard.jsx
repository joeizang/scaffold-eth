// @ts-ignore
import React, { Fragment, useCallback, useEffect, useReducer, useState } from 'react'
import { Box, Button, Card, CardActions, CardMedia, CardContent, Typography } from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'
import { ethers } from 'ethers'
// @ts-ignore
import multihash from 'multihashes'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert from '@mui/material/Alert'
import { CopyToClipboard } from 'react-copy-to-clipboard'

export const toBase58 = contentHash => {
  let hex = contentHash.substring(2)
  let buf = multihash.fromHexString(hex)
  return multihash.toB58String(buf)
}

const Notification = React.forwardRef(function Alert(props, ref) {
  // @ts-ignore
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

export default function NftCard(props) {
  const { contract, mainnet, to, id, transactionHash, etherscan } = props
  const [state, setState] = useState({
    data: {},
    title: '',
    src: '',
    txLink: '',
  })
  const [open, setOpen] = useState(false)
  const [hoverActive, setHoverActive] = useReducer(previous => !previous, false)
  const handleTooltipClose = () => {
    setOpen(false)
  }

  const handleTooltipOpen = () => {
    setOpen(true)
  }
  const run = useCallback(async () => {
    try {
      let data = await contract.tokensData(ethers.BigNumber.from(id === '0x' ? '0x0' : id))
      let toFormatted = ethers.utils.hexZeroPad(ethers.utils.hexStripZeros(to), 20)
      const name = await mainnet.lookupAddress(toFormatted)
      let title = name ? name : toFormatted

      const src = 'https://remix-project.mypinata.cloud/ipfs/' + toBase58(data.hash)
      const txLink = etherscan + transactionHash

      setState({ data, title, src, txLink })
    } catch (error) {
      console.error(error)
    }
  }, [contract, etherscan, id, mainnet, to, transactionHash])
  useEffect(() => {
    try {
      run()
    } catch (error) {
      console.log({ error })
    }
  }, [run])
  return (
    <>
      <Box
        sx={{
          position: 'relative',
          padding: '2px',
          color: '#333333',
          borderRadius: 5,
        }}
        maxWidth={310}
      >
        <Card variant={'outlined'} sx={{ borderRadius: 5, zIndex: 10 }}>
          <CardMedia component={'img'} width={200} image={state.src} alt={'nftimage'} />
          <CardContent
            sx={{
              background:
                'linear-gradient(90deg, #d4def4, #d9dff6, #dee1f7, #e3e2f9, #e8e4fa, #ede5fb, #f1e6fb, #f6e8fc)',
            }}
          >
            <CopyToClipboard text={state.title} onCopy={handleTooltipOpen}>
              <Typography
                variant={'body2'}
                noWrap={false}
                fontWeight={400}
                color={'#333333'}
                onMouseOver={() => setHoverActive()}
                onMouseOut={() => setHoverActive()}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ':hover': { cursor: 'pointer' },
                }}
                component={'span'}
              >
                {state.title.length > 20
                  ? `${state.title.substring(0, 7)}...${state.title.substring(state.title.length - 7)}`
                  : state.title}
                {hoverActive && (
                  <Box component={'span'} ml={1}>
                    <ContentCopyIcon fontSize="small" />
                  </Box>
                )}
              </Typography>
            </CopyToClipboard>
            <Typography variant={'caption'} fontWeight={700} color={'#333333'}>
              {state.data.tokenType} {state.data.payload}
            </Typography>
          </CardContent>
          <CardActions
            disableSpacing
            sx={{
              background:
                'linear-gradient(90deg, #d4def4, #d9dff6, #dee1f7, #e3e2f9, #e8e4fa, #ede5fb, #f1e6fb, #f6e8fc)',
            }}
          >
            <Button
              variant={'contained'}
              startIcon={<InfoIcon />}
              fullWidth
              href={state.txLink}
              target="_blank"
              rel="noreferrer"
              sx={{ background: '#81a6f7', ':hover': { background: '#1976d2', color: '#fff' } }}
            >
              <Typography variant={'button'} fontWeight={'bolder'}>
                View Transaction
              </Typography>
            </Button>
          </CardActions>
        </Card>
      </Box>
      <Snackbar open={open} autoHideDuration={1200} onClose={handleTooltipClose}>
        <Notification
          // @ts-ignore
          severity={'info'}
        >
          {'Address copied!'}
        </Notification>
      </Snackbar>
    </>
  )
}
