import Symbol from "./Symbol"
import TradingView from "@mathieuc/tradingview"
// function App() {
//   return (
//     <div className="app">
//       <div className="box-vertical">
//         <div className="box-horizontal">
//           <div className="symbol">
//             <div className="symbol__row-info">
//               <span className="symbol__name">
//                 BTC
//               </span>
//               <span className="symbol__price">$324.54</span>
//               <span className="symbol__tick tick-pos">↑</span>
//             </div>
//             <div className="symbol__row-info">
//               <div className="symbol__meta">
//                 <span className="symbol__meta-title">CHANGE 24H</span>
//                 <span className="symbol__meta-desc tick-pos">+2.39%</span>
//               </div>
//               <div className="symbol__meta">
//                 <span className="symbol__meta-title">VOLUME</span>
//                 <span className="symbol__meta-desc">$154 239 281 000</span>
//               </div>
//             </div>
//             <div className="symbol__row-spacer"></div>
//             <div className="symbol__row-info">
//               <span className="symbol__status tick-pos">MARKET OPEN</span>
//               <span className="symbol__exchange"> / BINANCE / UPDATED 5:46 PM 21 SEP 2021</span>
//             </div>
//           </div>
//           <div className="symbol">bSDSDS</div>
//           <div className="symbol">c</div>
//         </div>
//       </div>
//     </div>
//   );
// }



const App = (props) => {
  const searchParams = new URLSearchParams(window.location.search);

  const setupTradingViewClient = () => {
    this.tvClient = new TradingView.Client();
            
    this.tvClient.onError((...error) => {
        console.error("TradingView client error: ", ...error);
        this.setState({ hasErrored: true });
    });
  }


  let symbols = [];
  for (let symbol of searchParams.entries()) {
    console.log(symbol)
    let [qsName, value] = symbol;

    let [assetName, pair, prec, provider] = value.split(";");
    if (provider.toLowerCase() === "tv") setupTradingViewClient();

    symbols.push(<Symbol asset={assetName} pair={pair} precision={parseInt(prec)} provider={provider} tvClient={this.tvClient}/>)
    console.log(symbols)
  }

  return (
    <div className="app">
      <div className="box-vertical">
        <div className="box-horizontal">
          {symbols}
        </div>
      </div>
    </div>
  )
}


export default App;
