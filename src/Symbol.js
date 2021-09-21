import React from "react"
import Ticker from "./Ticker"

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineController,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

import { Chart } from "react-chartjs-2"
import TradingView from "@mathieuc/tradingview"

function dateFormat (date, fstr, utc) {
    utc = utc ? 'getUTC' : 'get';
    return fstr.replace (/%[YmdHMS]/g, function (m) {
      switch (m) {
      case '%Y': return date[utc + 'FullYear'] (); // no leading zeros required
      case '%m': m = 1 + date[utc + 'Month'] (); break;
      case '%d': m = date[utc + 'Date'] (); break;
      case '%H': m = date[utc + 'Hours'] (); break;
      case '%M': m = date[utc + 'Minutes'] (); break;
      case '%S': m = date[utc + 'Seconds'] (); break;
      default: return m.slice (1); // unknown code, remove %
      }
      // add leading zero if required
      return ('0' + m).slice (-2);
    });
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
);

class Symbol extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            currentPrice: 0,
            prevPrice: 0,
            changeDaily: 0, 
            volume: 0,
            dailyLow: 0,
            dailyHigh: 0,
            updateTime: "",
            lastId: 0,
            hasErrored: false,
            currentDayData: {}
        }

        this.updatePrices = this.updatePrices.bind(this)
        this.updateDayChart = this.updateDayChart.bind(this)

        if (this.props.provider.toLowerCase() === "tv") {
            this.tvChart = new this.props.tvClient.Session.Chert()
            chart.setMarket(this.props.pair, {
                timeframe: 'D'
            })

            chart.onError((...err) => {
                console.error(err)
            })

            chart.onSymbolLoaded(() => { // When the symbol is successfully loaded
                console.log(`Market "${chart.infos.description}" loaded !`);
            });
              
            chart.onUpdate(() => { // When price changes
                if (!chart.periods[0]) return;
                console.log(`[${chart.infos.description}]: ${chart.periods[0].close} ${chart.infos.currency_id}`);
                
                let updateTime = dateFormat(new Date(), "%H:%M:%S %d-%m-%Y");
                let prevPrice = this.state.currentPrice;
                let changeDaily = (chart.periods[0].close - chart.periods[0].open) / chart.periods[0].open * 100

                this.setState({
                    currentPrice: chart.periods[0].close,
                    prevPrice,
                    changeDaily,
                    volume: 0,
                    dailyLow: 0,
                    dailyHigh: 0,
                    lastId: Date.now(),
                    updateTime,
                    hasErrored: false
                })
            });
        }        
        
    }

    componentDidMount() {
        //setInterval(this.updatePrices, 30*1000)
        //setInterval(this.updateDayChart, 3*60*1000)

        this.updateDayChart()
        this.updatePrices()
    }

    async binance_updateDayChart() {
        return new Promise(resolve => {
            let curTimestamp = new Date().getTime();
            let pastTimestamp = curTimestamp - (24*60*60*1000); // -24h

            let data = []
            fetch(`https://api.binance.com/api/v3/klines?symbol=${this.props.pair}&interval=15m&startTime=${pastTimestamp}&endTime=${curTimestamp}&limit=400`)
                .then(response => response.json())
                .then((json) => {
                    json.forEach(kline => {
                        let close = kline[4];
                        data.push(close);
                    });

                    resolve(data)
                })
                .catch((e) => {
                    console.log(e)
                })
        })
    }


    async updateDayChart() {
        let data;

        if (this.props.provider.toLowerCase() === "binance") {
            data = await this.binance_updateDayChart();
        }

        let newState = Object.assign({}, this.state);
        newState.currentDayData = data;

        this.setState(newState);
    }

    async binance_updatePrices() {
        return new Promise((resolve, reject) => {
            fetch("https://api.binance.com/api/v3/ticker/24hr?symbol="+this.props.pair)
            .then(response => response.json())
            .then((json) => {
                let updateTime = this.state.updateTime

                if (json.lastId !== this.state.lastId) {
                    updateTime = dateFormat(new Date(), "%H:%M:%S %d-%m-%Y")

                    resolve({
                        currentPrice: parseFloat(json.lastPrice),
                        changeDaily: parseFloat(json.priceChangePercent),
                        volume: parseFloat(json.quoteVolume),
                        dailyHigh: parseFloat(json.highPrice),
                        dailyLow: parseFloat(json.lowPrice),
                        lastId: json.lastId
                    })
                } else {
                    resolve(null)
                }
            }).catch((e) => {
                reject()
            })
        })
    }

    async updatePrices() {
        let data;

        try {
            if (this.props.provider.toLowerCase() === "binance") {
                data = await this.binance_updatePrices()

                if (data == null) {
                    return; // nothing new.
                }

                let updateTime = dateFormat(new Date(), "%H:%M:%S %d-%m-%Y")
                data.updateTime = updateTime;
                data.prevPrice = this.state.currentPrice;

            } else if (this.props.provider.toLowerCase() === "tv") {
                return; // if the provider is tv, do nothing, since we get updates from the socket.
            }

            

            this.setState(data)
        } catch(e) {
            console.error(e)
            this.setState({
                currentPrice: 0,
                prevPrice: 0,
                changeDaily: 0,
                volume: 0,
                dailyHigh: 0,
                dailyLow: 0,
                lastId: 0,
                updateTime: 0,
                hasErrored: true,
                currentDayData: this.state.currentDayData
            })
        }
    }

    render() {
        let tickSymbol = "remove"
        let tickClass = "tick-zero"

        if (this.state.currentPrice > this.state.prevPrice) {
            tickSymbol = "arrow_upward"
            tickClass = "tick-pos"
        } else if (this.state.currentPrice < this.state.prevPrice) {
            tickSymbol = "arrow_downward"
            tickClass = "tick-neg"
        }

        const chartOptions = {
            responsive: false, 
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    display: false
                },
                x: {
                    display: false
                }
            },
            layout: {
                padding: 0
            }
        }

        //TODO: prefs!!
        const preferences = {
            chartVisibility: 1,
            interpTension: 0.2
        }

        const chartData = {
            labels: Array.from(Array(this.state.currentDayData.length).keys()),
            datasets: [{
                data: this.state.currentDayData,
                fill: true,
                borderColor: this.state.changeDaily < 0 ? `rgba(175, 63, 61, ${0.25 * preferences.chartVisibility})` 
                                : `rgba(21, 159, 73, ${0.25 * preferences.chartVisibility})`,
                borderWidth: 2,
                backgroundColor: this.state.changeDaily < 0 ? `rgba(175, 63, 61, ${0.125 * preferences.chartVisibility})` 
                                : `rgba(21, 159, 73, ${0.125 * preferences.chartVisibility})`,
                tension: preferences.interpTension,
                pointRadius: 0
            }]
        }

        return (
        <div className="symbol">
            <div className="symbol__chart">
                <Chart type="line" options={chartOptions} data={chartData} width={430} height={180} />
            </div>
            <div className="symbol__row-info">
              <span className="symbol__name" ref="name">
                {this.props.asset}
              </span>
              {/*<Ticker className="symbol__price" textSize={45} value={this.state.currentPrice} charsSet={'$0123456789.'.split('')} />*/}

              <span className="symbol__price">${this.state.currentPrice.toFixed(this.props.precision)}</span>
              <span className={"symbol__tick " + tickClass}>
                  <span className="material-icons">
                    {tickSymbol}
                  </span>
              </span>
            </div>
            <div className="symbol__row-info symbol__row-meta">
              <div className="symbol__meta">
                <span className="symbol__meta-title">CHANGE 24H</span>
                <span className={"symbol__meta-desc " + (this.state.changeDaily >= 0 ? "tick-pos" : "tick-neg")}>{this.state.changeDaily.toFixed(2)}%</span>
              </div>
              <div className="symbol__meta">
                <span className="symbol__meta-title">VOLUME</span>
                <span className="symbol__meta-desc">${numberWithCommas(this.state.volume.toFixed(0))}</span>
              </div>
            </div>
            <div className="symbol__row-info symbol__row-meta">
                <div className="symbol__meta">
                    <span className="symbol__meta-title">LOW 24H</span>
                    <span className="symbol__meta-desc ">${this.state.dailyLow.toFixed(this.props.precision)}</span>
                </div>
                <div className="symbol__meta">
                    <span className="symbol__meta-title">HIGH 24H</span>
                    <span className="symbol__meta-desc ">${this.state.dailyHigh.toFixed(this.props.precision)}</span>
                </div>
            </div>
            {/*<div className="symbol__row-spacer"></div>*/}
            <div className="symbol__row-info symbol__row-status">
              <span className={"symbol__status " + (this.state.hasErrored ? "tick-neg" : "tick-pos")}>
                  { this.state.hasErrored ? "ERROR" : "MARKET OPEN" }
              </span>
              <span className="symbol__exchange">
                  { this.state.hasErrored ? "" : ("/ BINANCE / UPDATED " + this.state.updateTime)}
              </span>
            </div>
        </div>
        )
    }
}

export default Symbol;