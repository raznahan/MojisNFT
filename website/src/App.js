import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import myEpicNft from './utils/MyEpicNFT.json';

const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = '';
const TOTAL_MINT_COUNT = 50;

const CONTRACT_ADDRESS = "0xEC6Ef6062A8b3ba02257cFF35a9bB83A1bD239F4";
const { ethereum } = window;

const App = () => {

  const [currentAccount, setCurrentAccount] = useState("");
  const [maxMint, setMaxMint] = useState("0");
  const [minted, setMinted] = useState("0");
  const [mintButtonDisabled, setMintButtonDisabled] = useState(false);
  const [loaderClass, setLoaderClass] = useState("");

  const checkIfWalletIsConnected = async () => {

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {

      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);

      if (await isConnectedToRinkeyby()) {
        await setMintStat();
      }
      else {
        alert("You are not connected to the Rinkeby Test Network!");
        return;
      }
      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      setupEventListener();

    } else {
      console.log("No authorized account found")
    }
  }
  const isConnectedToRinkeyby = async () => {

    let chainId = await ethereum.request({ method: 'eth_chainId' });
    console.log("Connected to chain " + chainId);

    // String, hex code of the chainId of the Rinkebey test network
    const rinkebyChainId = "0x4";

    if (chainId == rinkebyChainId)
      return true;
    else
      return false;


  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      await setMintStat();

      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener()
    } catch (error) {
      console.log(error)
    }
  }
  const setMintStat = async () => {
    const MyEpicNFTContract = getContract();
    if (MyEpicNFTContract) {
      const totalMinted = await MyEpicNFTContract.getTotalNFTsMinted();
      console.log('totalMinted:' + totalMinted);
      const maxMint = await MyEpicNFTContract.maxMint();
      if (totalMinted >= maxMint)
        setMintButtonDisabled(true);
      console.log('maxMint: ' + maxMint);
      setMinted(totalMinted.toString());
      setMaxMint(maxMint.toString());
    }
    else {
      console.log('could not fetch mint state');
    }
  }
  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    const MyEpicNFTContract = getContract();
    if (MyEpicNFTContract) {
      // THIS IS THE MAGIC SAUCE.
      // This will essentially "capture" our event when our contract throws it.
      // If you're familiar with webhooks, it's very similar to that!
      MyEpicNFTContract.on("NewEpicNFTMinted", (from, tokenId) => {
        console.log(from, tokenId.toNumber())
        alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
      });
     
      console.log("Setup event listener!");

    }
    else {
      console.log('error in contract creation');
    }
  };

  const getContract = () => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

      return connectedContract;
    }
    else {
      console.log('ethereum object not found');
      return null;
    }
  }
  const askContractToMintNft = async () => {
    try {
      const MyEpicNFTContract = getContract();
      if (MyEpicNFTContract) {
        setLoaderClass("fa fa-spinner fa-spin");
        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await MyEpicNFTContract.makeAnEpicNFT();

        console.log("Mining...please wait.")
        await nftTxn.wait();
        setLoaderClass("");
        console.log(nftTxn);
        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
      } else {
        window.alert("Ethereum object doesn't exist!")
      }
    } catch (error) {
      setLoaderClass("");
      console.log(error)
    }
  }


  useEffect(async () => {
    await checkIfWalletIsConnected();
  }, [])

  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );


  const renderMintUI = () => (
    <div>
      <p className="sub-text">{minted}/{maxMint} minted so far!</p>
      <button onClick={askContractToMintNft} disabled={mintButtonDisabled} className="connect-wallet-button">
        <i className={loaderClass}></i>Mint NFT
      </button>
    </div>
  )

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === "" ? renderNotConnectedContainer() : renderMintUI()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;