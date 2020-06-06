import React , {Component} from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component{

  state = { walletInfo: {address: 'foo', balance: 9999}};

  componentDidMount()
  {
    fetch('http://localhost:3000/api/wallet-info').then(response=>response.json()).then(json=>{
      console.log(json);
      this.setState({walletInfo: json});
    })
  }

  render()
  {
    return (
      <div>
      <h1>
        WELCOME TO BLOCKCHAIN
      </h1>
      <div>
        Address: {this.state.walletInfo.address}
        <br></br>
        Balance: {this.state.walletInfo.balance}
      </div>
      </div>
  );
  }
}

export default App;
