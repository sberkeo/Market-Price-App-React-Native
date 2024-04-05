import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ScrollView, TextInput, ImageBackground, Animated, Dimensions } from 'react-native';


import AsyncStorage from '@react-native-async-storage/async-storage';

var widthx = Dimensions.get('window').width; 
var heightx = Dimensions.get('window').height; 

const PricerScreen = ({ navigation }) => {

    const [closedtopscreen, setclosedtopscreen] = useState(true);
    const [closedsocket, setclosedsocket] = useState();
    const [isVisible, setIsVisible] = useState(false);
    const [isVisibleinfo, setisVisibleinfo] = useState(false);
    const [filtermode, setfiltermode] = useState(false);
    const translateY = useState(new Animated.Value(0))[0];
    const translateYinfo = useState(new Animated.Value(0))[0];
    const [searchSymbol, setSearchSymbol] = useState('');
    const [searchSymbolAdd, setsearchSymbolAdd] = useState('');
    const [settingsmode, setsettingsmode] = useState(false);
    const [pairsAndMarkets, setpairsAndMarkets] = useState([]);
    const [webSockets, setWebSockets] = useState({});
    const [data, setData] = useState([]);
    const [dataadd, setDataadd] = useState([
        { "base-currency-logoid": "crypto/XTVCBTC", "currency-logoid": "crypto/XTVCUSDT", "currency_code": "USDT", "description": "Bitcoin / TetherUS", "exchange": "BINANCE", "provider_id": "binance", "symbol": "BTCUSDT", "type": "spot", "typespecs": ["crypto"] }
    ]);
    const [filteredData, setFilteredData] = useState([]);
    const [liveindicator, setliveindicator] = useState({
        AAPL: false,
        GOOGL: false,
    });



    useEffect(() => {

        //console.log(settingsmode);
        if (settingsmode === true) {
            for (const key in webSockets) {
                if (webSockets.hasOwnProperty(key)) {

                    const webSocket = webSockets[key].ws;


                    const closeCode = 587; // Kapatma kodu
                    const closeReason = "USER CLOSE"; // Kapatma nedeni
                    webSocket.close(closeCode, closeReason);
                    webSocket.onmessage = null;

                    delete webSockets[key]; 
                }
            }
        }
        if (settingsmode === false) {
            pairsAndMarkets.forEach(({ pair, market, symbolx }) => {
                main(pair, market, symbolx); 
            });
        }

    }, [settingsmode]);

    useEffect(() => {
        if(data.length === 0)
        {
            setsettingsmode(false);
        }
        ////console.log(data);
    }, [data]);



    useEffect(() => {
        getPairsAndMarketsFromDatabase();
    }, []);


    useEffect(() => {
        searchSymbolAddfunction(searchSymbolAdd);
    }, [searchSymbolAdd]);

    useEffect(() => {
        // Tüm sembollerin durumunu kontrol etmek için bir fonksiyon
        const checkSymbolStatus = async () => {
            for (const symbol in liveindicator) {
                if (liveindicator[symbol]) {
                   
                    await new Promise(resolve => setTimeout(resolve, 100));
                    ///console.log("sdfdsfsdfsdfsdfs",liveindicator[symbol]);
                   
                    const updatedLiveIndicator = { ...liveindicator };
                    updatedLiveIndicator[symbol] = false;
                    setliveindicator(updatedLiveIndicator);

                   
                    const existingData = await AsyncStorage.getItem(`symbolData-${symbol}`);
                    if (existingData) {
                        const existingDataParsed = JSON.parse(existingData);
                        //////console.log(`Processing data for symbol: ${symbol}`);
                        //////console.log(existingDataParsed);

           
                    }
                }
            }
        };

        const interval = setInterval(() => {
            checkSymbolStatus();
        }, 350); 

        //console.log("liveeeeeeeee",liveindicator);

        return () => clearInterval(interval);

    }, [liveindicator]);


    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchData();
        }, 2000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (searchSymbol.trim() === '') {
            setFilteredData([]);
        } else {
            const filtered = data.filter((item) =>
                item.symbol.includes(searchSymbol.toUpperCase())
            );
            setFilteredData(filtered);
        }
    }, [searchSymbol, data]);




    const toggleDialogADD = async () => {

        if (isVisible) {
            Animated.timing(translateY, {
                toValue: 300,
                duration: 150,
                useNativeDriver: true,
            }).start(() => setIsVisible(false));
        } else {
            setIsVisible(true);
            Animated.timing(translateY, {
                toValue: -200,
                duration: 150,
                useNativeDriver: true,
            }).start();
        }
    };


    const toggleDialoginfo = async () => {

        if (isVisibleinfo) {
            Animated.timing(translateYinfo, {
                toValue: 300,
                duration: 150,
                useNativeDriver: true,
            }).start(() => setisVisibleinfo(false));
        } else {
            setisVisibleinfo(true);
            Animated.timing(translateYinfo, {
                toValue: -200,
                duration: 150,
                useNativeDriver: true,
            }).start();
        }
    };

    const handleOutADDPress = () => {

        if (isVisible) {
            toggleDialogADD();

        };

    };



    const writePairsAndMarketsFromDatabase2x = async (data) => {
        try {
            await AsyncStorage.setItem('pairsAndMarkets', JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('AsyncStorage error:', error);
            return pairsAndMarkets;
        }
    };


    const writePairsAndMarketsFromDatabase = async () => {
        try {
            await AsyncStorage.setItem('pairsAndMarkets', JSON.stringify(pairsAndMarkets));
            return true;
        } catch (error) {
            console.error('AsyncStorage error:', error);
            return pairsAndMarkets;
        }
    };

    const getPairsAndMarketsFromDatabase = async () => {
        try {
            const pairsAndMarketss = await AsyncStorage.getItem('pairsAndMarkets');
            if (pairsAndMarketss) {
                const jsoner = JSON.parse(pairsAndMarketss);
                setpairsAndMarkets(jsoner); 

                jsoner.forEach(({ pair, market, symbolx }) => {
                    main(pair, market, symbolx);
                });
                fetchData();
            }
        } catch (error) {
            console.error('AsyncStorage error:', error);
            return pairsAndMarkets;
        }
    };



    const searchSymbolAddfunction = async (query) => {
        try {
            const response = await fetch(`https://symbol-search.tradingview.com/symbol_search/?text=${query}`);
            if (response.status === 200) {
                const data = await response.json();
                if (data.length !== 0) {
                    let symbolDataAdd = data;
                    if (!Array.isArray(data)) {
                        symbolDataAdd = [data];
                    }
                    setDataadd(symbolDataAdd);
                    //////console.log(symbolDataAdd);
                    return true;
                }
                else {
                    return null;
                }
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }
    };

    const search = async (query, category) => {
        try {
            const response = await fetch(`https://symbol-search.tradingview.com/symbol_search/?text=${query}&type=${category}`);
            if (response.status === 200) {
                const data = await response.json();
                if (data.length !== 0) {
                    const symbolData = data[0];
                    return symbolData;
                } else {
                    //////console.log('Nothing Found.');
                    throw new Error('Nothing Found.');
                }
            } else {
                //////console.log('Network Error!');
                throw new Error('Network Error!');
            }
        } catch (error) {
            //console.error(error);
            throw error;
        }
    };

    const generateSession = () => {
        const stringLength = 12;
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const randomString = Array.from({ length: stringLength }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
        return `qs_${randomString}`;
    };

    const prependHeader = (content) => `~m~${content.length}~m~${content}`;

    const constructMessage = (func, paramList) => JSON.stringify({ m: func, p: paramList }, (key, value) => (value === undefined ? null : value), 2);

    const createMessage = (func, paramList) => prependHeader(constructMessage(func, paramList));

    const sendWebSocketMessage = (ws, func, args) => {
        const message = createMessage(func, args);
        ws.send(message);
    };

    const sendPingPacket = (ws, result) => {
        const pingStrMatch = result.match(/.......(.*)/);
        if (pingStrMatch) {
            const pingStr = pingStrMatch[1];
            ws.send(`~m~${pingStr.length}~m~${pingStr}`);
        }
    };
    const handleWebSocketMessages = async (ws, modex) => {

        ws.onmessage = async (event) => {

            if (modex === false) {
                const result = event.data;
                if (result.includes('quote_completed') || result.includes('session_id')) {
                    return;
                }
                const res = result.match(/^.*?({.*)$/);
                if (res) {
                    try {
                        const jsonRes = JSON.parse(res[1]);
                        if (jsonRes.m === 'qsd') {
                            const prefix = jsonRes.p[1];
                            const symbol = prefix.n;
                            const price = prefix.v.lp;
                            const volume = prefix.v.volume;
                            const change = prefix.v.ch;
                            const changePercentage = prefix.v.chp;

                            if (typeof changePercentage !== 'undefined' && typeof volume !== 'undefined') {

                                const existingData = await AsyncStorage.getItem(`symbolData-${prefix.n}`);
                                // ////console.log(existingData);
                                const existingDataParsed = existingData ? JSON.parse(existingData) : {};

                                if (symbol === undefined || symbol === null || symbol === "") {
                                    existingDataParsed.symbol = existingDataParsed.symbol;
                                } else {
                                    existingDataParsed.symbol = symbol;
                                }

                                if (price === undefined || price === null || price === "") {
                                    existingDataParsed.price = existingDataParsed.price;
                                } else {
                                    existingDataParsed.price = price;
                                }

                                if (change === undefined || change === null || change === "") {
                                    existingDataParsed.change = existingDataParsed.change;
                                } else {
                                    existingDataParsed.change = change;
                                }

                                if (changePercentage === undefined || changePercentage === null || changePercentage === "") {
                                    existingDataParsed.changePercentage = existingDataParsed.changePercentage;
                                } else {
                                    existingDataParsed.changePercentage = changePercentage;
                                }

                                if (volume === undefined || volume === null || volume === "") {
                                    existingDataParsed.volume = existingDataParsed.volume;
                                } else {
                                    existingDataParsed.volume = volume;
                                }

                                var newLiveIndicator = { ...liveindicator };
                                newLiveIndicator[prefix.n] = true; 

                                setliveindicator(newLiveIndicator);
                                existingDataParsed.state = true;

                                await AsyncStorage.setItem(`symbolData-${prefix.n}`, JSON.stringify(existingDataParsed));
                            } else {
                                const existingData = await AsyncStorage.getItem(`symbolData-${prefix.n}`);
                                //////console.log(existingData);
                                const existingDataParsed = existingData ? JSON.parse(existingData) : {};

                                if (symbol === undefined || symbol === null || symbol === "") {
                                    existingDataParsed.symbol = existingDataParsed.symbol;
                                } else {
                                    existingDataParsed.symbol = symbol;
                                }

                                if (price === undefined || price === null || price === "") {
                                    existingDataParsed.price = existingDataParsed.price;
                                } else {
                                    existingDataParsed.price = price;
                                }

                                if (change === undefined || change === null || change === "") {
                                    existingDataParsed.change = existingDataParsed.change;
                                } else {
                                    existingDataParsed.change = change;
                                }

                                if (changePercentage === undefined || changePercentage === null || changePercentage === "") {
                                    existingDataParsed.changePercentage = existingDataParsed.changePercentage;
                                } else {
                                    existingDataParsed.changePercentage = changePercentage;
                                }

                                if (volume === undefined || volume === null || volume === "") {
                                    existingDataParsed.volume = existingDataParsed.volume;
                                } else {
                                    existingDataParsed.volume = volume;
                                }

                                existingDataParsed.state = true;


                                
                                var newLiveIndicator = { ...liveindicator };
                                newLiveIndicator[prefix.n] = true; 
                               
                                setliveindicator(newLiveIndicator);


                                //console.log(settingsmode);
                                
                                await AsyncStorage.setItem(`symbolData-${prefix.n}`, JSON.stringify(existingDataParsed));
                            }

                        }
                    } catch (error) {
                        // JSON parsing hatasını ele alın
                        //console.error(`JSON parsing error: ${error}`);
                    }
                } else {
                    sendPingPacket(ws, result);
                }
            }
        };
    };





    const [tetikc, settetikc] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            ////console.log("tetikc", tetikc)
            let arraa = parseInt(tetikc) + 1;
            settetikc(arraa);
        }, 5000); // 10 saniye (10,000 milisaniye)

        return () => {
            clearInterval(interval);
        };
    }, [tetikc]);


    useEffect(() => {
        
        //////console.log("closedsocket kontollllllll", closedsocket);

        
        for (const session in closedsocket) {
            if (closedsocket.hasOwnProperty(session)) {
                const item = closedsocket[session];
                // Durumu 0 olan verileri işle
                if (item.state === 0 && item.code != 587) {
                    //console.log("closedsocket reload. STATE", item.state);
                    //console.log("closedsocket reload. xsymbol", item.xsymbol);
                    //console.log("closedsocket reload. xsymbol", item.session);
                    //console.log("closedsocket reload. xsymbol", item.code);

                    mainreload(item.pair, "", item.xsymbol, session); 


                }
            }
        }


    }, [tetikc]); 





    const mainreload = async (pair, market, symbolx, sessionx) => {
        try {

            //console.log("MAIN RELOAD RUN", symbolx);


            const symbolId = symbolx;

            const tradingViewSocket = 'wss://data.tradingview.com/socket.io/websocket';
            const headers = {
                Origin: 'https://data.tradingview.com',
            };
            const ws = new WebSocket(tradingViewSocket, [], { headers }); 

            const session = sessionx;

            const updateStateTo1ForSession = (session) => {
                setclosedsocket((prevClosedsocket) => {
                    const updatedClosedsocket = { ...prevClosedsocket };

                    for (const key in updatedClosedsocket) {
                        if (updatedClosedsocket.hasOwnProperty(key) && key === session) {
                            updatedClosedsocket[key].state = 1;
                        }
                    }
                    //console.log("UPDATED CLOSED SOCKETS :  ", updatedClosedsocket)
                    return updatedClosedsocket;
                });
            };

            ws.onopen = () => {



                sendWebSocketMessage(ws, 'quote_create_session', [session]);
                sendWebSocketMessage(ws, 'quote_set_fields', [session, 'lp', 'volume', 'ch', 'chp']);
                sendWebSocketMessage(ws, 'quote_add_symbols', [session, symbolId]);


               
                setWebSockets((prevWebSockets) => ({
                    ...prevWebSockets,
                    [session]: { ws, pair, symbolx },
                }));

                //console.log(closedsocket);

                updateStateTo1ForSession(session);

            };

            ws.onclose = (event) => {


                setclosedsocket((closedsocket) => ({
                    ...closedsocket,
                    [session]: {
                        xsymbol: symbolId,
                        pair: pair,
                        state: 0,
                        code: event.code,
                    },
                }));

            };

            ws.onerror = (error) => {
                //console.error(`WebSocket error: ${error}`);
            };

            handleWebSocketMessages(ws, false);
        } catch (error) {
            //console.error(error);
        }
    };

    const main = async (pair, market, symbolx) => {
        try {

            


            const symbolId = symbolx;

            const tradingViewSocket = 'wss://data.tradingview.com/socket.io/websocket';
            const headers = {
                Origin: 'https://data.tradingview.com',
            };
            const ws = new WebSocket(tradingViewSocket, [], { headers }); 

            const session = generateSession();

            ws.onopen = () => {

              


                sendWebSocketMessage(ws, 'quote_create_session', [session]);
                sendWebSocketMessage(ws, 'quote_set_fields', [session, 'lp', 'volume', 'ch', 'chp']);
                sendWebSocketMessage(ws, 'quote_add_symbols', [session, symbolId]);


                // WebSocket bağlantısını saklayın
                setWebSockets((prevWebSockets) => ({
                    ...prevWebSockets,
                    [session]: { ws, pair, symbolx },
                }));
            };



            ws.onclose = (event) => {
                ////console.log(`WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
                // Kapatılan WebSocket'in session bilgisini logla
                ////console.log(`WebSocket closed for session: ${session}`, symbolx, pair);
                setclosedsocket((closedsocket) => ({
                    ...closedsocket,
                    [session]: {
                        xsymbol: symbolId,
                        pair: pair,
                        state: 0,
                        code: event.code,
                    },
                }));
            };

            ws.onerror = (error) => {
                //console.error(`WebSocket error: ${error}`);
            };

            handleWebSocketMessages(ws, false);
        } catch (error) {
            //console.error(error);
        }
    };







    const getAllSymbolData = async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const newData = [];
            //////console.log("keyss", keys)
            for (const key of keys) {
                if (key.startsWith('symbolData-')) {
                    const symbol = key.replace('symbolData-', '');
                    const existingData = await AsyncStorage.getItem(key);

                    if (existingData) {
                        const parsedData = JSON.parse(existingData);
                        newData.push({ symbol, ...parsedData });
                    }
                }
            }

            return newData;
        } catch (error) {
            console.error('AsyncStorage error:', error);
            return [];
        }
    };

    const fetchData = async () => {
        const allSymbolData = await getAllSymbolData();
        setData(allSymbolData);
    };










    const addsymbol = async (pair, market, symbolx) => {

        // Veriyi okuyun ve varsa mevcut veriyi getirin, yoksa boş bir nesne kullanın
        const existingData = await AsyncStorage.getItem(`symbolData-${symbolx}`);
        // ////console.log(existingData);
        const existingDataParsed = existingData ? JSON.parse(existingData) : {};

        existingDataParsed.symbol = symbolx;

        existingDataParsed.price = 0;

        existingDataParsed.change = 0;

        existingDataParsed.changePercentage = 0;

        existingDataParsed.volume = 0;

        existingDataParsed.state = true;

        // Güncellenmiş verileri kaydedin
        await AsyncStorage.setItem(`symbolData-${symbolx}`, JSON.stringify(existingDataParsed));

        //////console.log("pair", pair);
        //////console.log("market", market);
        //////console.log("symbolx", symbolx);

        const currentPairsAndMarkets = [...pairsAndMarkets];

       
        const newData = {
            pair: pair,
            market: market,
            symbolx: symbolx
        };

     
        currentPairsAndMarkets.push(newData);

        setpairsAndMarkets(currentPairsAndMarkets);
        writePairsAndMarketsFromDatabase2x(currentPairsAndMarkets);




        main(pair, market, symbolx); // Her bir çift ve piyasa için main fonksiyonunu çağır

        fetchData();

    };

    async function removeAllMatchingKeys(pairx) {
        try {
            const keys = await AsyncStorage.getAllKeys();
            ////console.log("Tüm anahtarlar alındı:", keys);

            for (const key of keys) {
                if (key.includes(pairx)) {
                    ////console.log(`Anahtar siliniyor: ${key}`);
                    await AsyncStorage.removeItem(key);
                    ////console.log(`Anahtar başarıyla silindi: ${key}`);
                }
            }

            ////console.log("Tüm eşleşen anahtarlar başarıyla silindi.");


        } catch (error) {
            console.error("Hata oluştu ANAKTER:", error);
            
        }
    }



    function removeSymbolxFtomData(symbolx) {
        const filteredData = data.filter(item => item.symbol !== symbolx);
        ////console.log(filteredData);
        setData(filteredData);
        return filteredData;
    }

    function removeSymbolxFromPairsAndMarkets(symbolx) {

        ////console.log(pairsAndMarkets, "pairsAndMarkets");


        const indexToRemove = pairsAndMarkets.findIndex(item => item.symbolx === symbolx);

        if (indexToRemove !== -1) {
            pairsAndMarkets.splice(indexToRemove, 1);
            ////console.log(`"${symbolx}" symbolx başarıyla kaldırıldı.`, pairsAndMarkets);
            writePairsAndMarketsFromDatabase2x(pairsAndMarkets);
            //getPairsAndMarketsFromDatabase();
            return true;

        } else {
            ////console.log(`"${symbolx}" symbolx bulunamadı.`);
            return false;

        }

    }

    const symbolRemover = async (symbolx) => {

        for (const key in webSockets) {
            if (webSockets.hasOwnProperty(key)) {
                const webSocket = webSockets[key].ws;
                if (webSocket && webSockets[key].symbolx === symbolx) {
                    // WebSocket bağlantısını kapatma
                    const closeCode = 587; // Kapatma kodu
                    const closeReason = "USER CLOSE"; // Kapatma nedeni
                    webSocket.close(closeCode, closeReason);
                    webSocket.onmessage = null;
                    //console.log("kapama", webSockets[key].ws)
                    //console.log("kapama", webSocket.onmessage)
                }
            }
        }

       
        await new Promise((resolve) => setTimeout(resolve, 300));
        ////console.log(webSockets);
     
        removeSymbolxFromPairsAndMarkets(symbolx);
        removeSymbolxFtomData(symbolx);
        removeAllMatchingKeys(symbolx);
        fetchData();


        await new Promise((resolve) => setTimeout(resolve, 50));


    };









    return (
        <View style={{ flex: 1, backgroundColor: "rgba(248,248,248,255)" }}>
            <View style={{flexDirection:"row",alignSelf: "center" , marginTop: 22, marginBottom: 14,marginRight:10}}>
            <TouchableOpacity onPress={() => { toggleDialoginfo(); }} style={{ width: 27, height: 27, alignItems: 'center', justifyContent: "center", alignSelf: "center", paddingRight: 0, marginTop: 0, marginLeft: 0, marginRight: 0, borderColor: "black", borderWidth: 0, borderRadius: 30 }}>
                <Image source={require('./assets/images/logo.png')} style={{ width: 27, height: 27, borderRadius: 0, borderWidth: 0, borderColor: "black", borderRadius: 0, resizeMode: "cover", flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: "center", alignSelf: "center", transform: [{ scale: 1 }], marginTop: 0 }} />
            </TouchableOpacity>
            <Text style={{ ...styles.symbol, fontWeight: 700, fontSize: 18, marginLeft: 4,marginTop:1, textAlign: "center", color: "rgba(0, 0, 0, 1)" }}>All Financial Market Watcher</Text>
            </View>
            <TouchableOpacity onPress={() => { toggleDialoginfo(); }} style={{ position: "absolute", top: 28, right: 10, alignSelf: "center", paddingRight: 0, marginTop: 0, marginLeft: 0, marginRight: 0, borderColor: "black", borderWidth: 0, borderRadius: 30 }}>
                <Image source={require('./assets/images/i.png')} style={{ width: 18, height: 18, borderRadius: 0, borderWidth: 0, borderColor: "black", borderRadius: 0, resizeMode: "cover", flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: "center", alignSelf: "center", transform: [{ scale: 1.1 }], marginTop: 0 }} />
            </TouchableOpacity>
            {closedtopscreen && (
                <TouchableOpacity onPress={() => {
                    setclosedtopscreen((currentValue) => !currentValue);
                    //console.log(pairsAndMarkets);
                    if (pairsAndMarkets.length === 0) {
                        toggleDialogADD();
                    }
                }}>
                    <ImageBackground
                        source={require('./assets/images/mobile-trading.png')} // Arka plan resmi dosya yolu
                        style={styles.imageBackground}
                    >
                        <View style={{ backgroundColor: "rgba(0, 0, 0, 0.2)", width: "100%", height: "100%", justifyContent: 'center' }}>
                            <Text style={{ ...styles.symbol, fontWeight: 500, fontSize: 18, marginLeft: 15, marginTop: 0, marginBottom: 0, textAlign: "center", color: "white" }}>You can add, monitor any financial data worldwide you want. </Text>
                        </View>
                    </ImageBackground>
                </TouchableOpacity>

            )}

            {filtermode && (
                <View style={{ alignItems: "center", paddingLeft: 10, paddingRight: 10, marginTop: 10 }}>
                    <TextInput
                        style={{ ...styles.input, color: "black", fontWeight: "900", textAlign: 'center', fontSize: 12}}
                        placeholder="Filter Symbol ?"
                        placeholderTextColor="black" // Placeholder rengini siyah yapar
                        
                        onChangeText={text => setSearchSymbol(text)}
                        value={searchSymbol}
                    />
                </View>
            )}
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ ...styles.symbol, fontWeight: 700, fontSize: 17, marginLeft: 15, marginTop: 12 }}>Watch List</Text>
                <Text style={{ ...styles.symbol, fontWeight: 400, fontSize: 12, marginRight: 15, marginTop: 17 }}>Update time may vary</Text>
                <View style={{ flexDirection: "row", justifyContent: "", marginRight: 10 }}>

                    <TouchableOpacity onPress={() => setfiltermode((currentValue) => !currentValue)} style={{ width: 22, height: 22, alignItems: 'center', justifyContent: "center", alignSelf: "center", marginRight: 0, marginTop: 10 }}>
                        <Image source={require('./assets/images/filter.png')} style={{ width: 22, height: 22, borderRadius: 0, borderWidth: 0, borderColor: "white", borderRadius: 0, resizeMode: "cover", flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: "center", alignSelf: "center", transform: [{ scale: 1 }], marginTop: 0 }} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setsettingsmode((currentValue) => !currentValue)} style={{ width: 23, height: 23, alignItems: 'center', justifyContent: "center", alignSelf: "center", marginLeft: 6, marginTop: 10 }}>
                        <Image source={require('./assets/images/settings.png')} style={{ width: 23, height: 23, borderRadius: 0, borderWidth: 0, borderColor: "white", borderRadius: 0, resizeMode: "cover", flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: "center", alignSelf: "center", transform: [{ scale: 1 }], marginTop: 0 }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { toggleDialogADD(); }} style={{ width: 24, height: 24, alignItems: 'center', justifyContent: "center", alignSelf: "center", paddingRight: 0, marginTop: 10, marginLeft: 6, marginRight: 3, borderColor: "black", borderWidth: 2, borderRadius: 30 }}>
                        <Image source={require('./assets/images/plus.png')} style={{ width: 20, height: 20, borderRadius: 0, borderWidth: 0, borderColor: "white", borderRadius: 0, resizeMode: "cover", flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: "center", alignSelf: "center", transform: [{ scale: 1 }], marginTop: 0 }} />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={{ alignItems: "center", padding: 10, height: (closedtopscreen ? ((heightx / 100) * 73) : ((heightx / 100) * 88)) }}>

                <ScrollView
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                    style={{ height: "100%" }}
                >
                    {searchSymbol.trim() === ''
                        ? data.map((item, index) => {
                            // Veriyi sayısal bir değere dönüştürün
                            const numericPrice = parseFloat(item.price);

                            // Virgülden sonraki ilk 3 basamağı alın
                            const formattedPrice = numericPrice.toFixed(5);

                            const symbol = item.symbol; // Örnek: "FX:GBPCAD"
                            const parts = symbol.split(':'); // ":" işaretine göre dizeyi böler
                            const cleanedSymbol = parts[1]; // Sağ taraftaki değeri alır
                            const cleanedSymbol2 = parts[0]; // Sağ taraftaki değeri alır

                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.dataItem,
                                        { backgroundColor: "white" },
                                    ]}
                                >
                                    <View>
                                        <Text style={{ ...styles.symbol, paddingLeft: 6 ,fontSize:13}}>{cleanedSymbol}</Text>
                                        <Text style={{ ...styles.symbol, fontWeight: 400, fontSize: 11, paddingLeft: 6 }}>{cleanedSymbol2}</Text>
                                    </View>
                                    {liveindicator[symbol] === true ?
                                        <View style={{ backgroundColor: "rgba(92, 204, 92, 0.8)", width: 6, height: 30, borderRadius: 50, position: 'absolute', left: 5 }}>
                                        </View>
                                        : null}
                                    <Text style={{ ...styles.price, fontWeight: "500", fontSize: settingsmode ? 10 : 12 }}>Price: {formattedPrice}</Text>
                                    <View
                                        style={[
                                            {
                                                flexDirection: "row",
                                                borderRadius: 17,
                                                padding: 7,
                                                backgroundColor: item.change > 0 ? "rgba(92, 204, 92, 0.2)" : "rgba(244, 196, 196, 1)",
                                            },
                                            // Şartlı stil eklemesi
                                        ]}
                                    >
                                        <Text style={{ ...styles.change, fontSize: settingsmode ? 8 : 10 }}>Change: {item.change}</Text>
                                        <Text style={{ ...styles.change, fontSize: settingsmode ? 8 : 10 }}> | {item.changePercentage} %</Text>
                                    </View>

                                    {settingsmode === true ?
                                        <TouchableOpacity
                                            style={[
                                                { right: 0 },
                                                settingsmode === true && { marginLeft: -18 }, // Şartlı stil eklemesi
                                            ]}
                                            onPress={() => symbolRemover(symbol)}
                                        >
                                            <View style={{ backgroundColor: "rgba(255, 0, 0, 1)", width: 12, height: 28, borderRadius: 50 }}>
                                            </View>
                                        </TouchableOpacity>
                                        : null}

                                </View>
                            );
                        })
                        : filteredData.map((item, index) => {
                            // Veriyi sayısal bir değere dönüştürün
                            const numericPrice = parseFloat(item.price);

                            // Virgülden sonraki ilk 3 basamağı alın
                            const formattedPrice = numericPrice.toFixed(3);

                            const symbol = item.symbol; // Örnek: "FX:GBPCAD"
                            const parts = symbol.split(':'); // ":" işaretine göre dizeyi böler
                            const cleanedSymbol = parts[1]; // Sağ taraftaki değeri alır
                            const cleanedSymbol2 = parts[0]; // Sağ taraftaki değeri alır


                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.dataItem,
                                        { backgroundColor: "white" },
                                    ]}
                                >
                                    <View>
                                        <Text style={{ ...styles.symbol, paddingLeft: 6, fontSize:13}}>{cleanedSymbol}</Text>
                                        <Text style={{ ...styles.symbol, fontWeight: 400, fontSize: 11, paddingLeft: 6 }}>{cleanedSymbol2}</Text>
                                    </View>
                                    {liveindicator[symbol] === true ?
                                        <View style={{ backgroundColor: "rgba(92, 204, 92, 0.8)", width: 6, height: 30, borderRadius: 50, position: 'absolute', left: 5 }}>
                                        </View>
                                        : null}
                                    <Text style={{ ...styles.price, fontWeight: "500", fontSize: settingsmode ? 10 : 12 }}>Price: {formattedPrice}</Text>
                                    <View
                                        style={[
                                            {
                                                flexDirection: "row",
                                                borderRadius: 17,
                                                padding: 7,
                                                backgroundColor: item.change > 0 ? "rgba(92, 204, 92, 0.2)" : "rgba(244, 196, 196, 1)",
                                            },
                                            // Şartlı stil eklemesi
                                        ]}
                                    >
                                        <Text style={{ ...styles.change, fontSize: settingsmode ? 8 : 10 }}>Change: {item.change}</Text>
                                        <Text style={{ ...styles.change, fontSize: settingsmode ? 8 : 10 }}> | {item.changePercentage} %</Text>

                                    </View>

                                    {settingsmode === true ?
                                        <TouchableOpacity
                                            style={[
                                                { right: 0 },
                                                settingsmode === true && { marginLeft: -18 }, // Şartlı stil eklemesi
                                            ]}
                                            onPress={() => symbolRemover(cleanedSymbol)}
                                        >
                                            <View style={{ backgroundColor: "rgba(255, 0, 0, 1)", width: 12, height: 28, borderRadius: 50 }}>
                                            </View>
                                        </TouchableOpacity>
                                        : null}

                                </View>
                            );
                        })}
                </ScrollView>
            </View>


            {isVisible && (

                <Animated.View style={[feeldialog.dialog, { transform: [{ translateY: translateY }], alignItems: "center", justifyContent: 'center', elevation: 5 }]} >


                    <View style={{ alignItems: "center", paddingLeft: 10, paddingRight: 10, marginTop: 10 }}>
                        <Text style={{ ...styles.symbol, fontWeight: 700, fontSize: 14, marginLeft: 15, marginTop: 2, marginBottom: 10, textAlign: "center", color: "rgba(0, 0, 0, 1)" }}>Symbol Search & Add</Text>

                        <TextInput
                            style={{ ...styles.input,fontSize:12, color: "black", fontWeight: "900", textAlign: 'center', marginLeft: 10, marginRight: 10, width: (widthx - 50) }}
                            placeholder="Type some market data name ?"
                            placeholderTextColor="black" // Placeholder rengini siyah yapar
                            onChangeText={text => setsearchSymbolAdd(text)}
                            value={searchSymbolAdd}
                        />
                    </View>

                    <View style={{ alignItems: "center", padding: 10, height: 300 }}>
                        <ScrollView
                            contentContainerStyle={styles.container}
                            showsVerticalScrollIndicator={false}
                        >

                            {dataadd.map((item, index) => {

                                return (
                                    <View
                                        key={index}
                                        style={[
                                            styles.dataItem2x,
                                            { backgroundColor: "#ebf2ff", width: (widthx - 70) },

                                        ]}
                                    >
                                        <View>
                                            <Text style={{ ...styles.symbol, paddingLeft: 6,fontSize:12 }}>{item.symbol}</Text>
                                            <Text style={{ ...styles.symbol, fontWeight: 400, fontSize: 10, paddingLeft: 6 }}>{item.provider_id}</Text>
                                        </View>
                                        <View style={{ paddingRight: 8 }}>
                                            <Text style={{ ...styles.price, fontWeight: "500", fontSize: 11 }}>{item.description.slice(0, 25)}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => {
                                            toggleDialogADD();
                                            addsymbol(
                                                item.symbol,
                                                item.prefix || item.exchange,
                                                `${(item.prefix || item.exchange).toUpperCase()}:${item.symbol.toUpperCase()}`
                                            );

                                        }}
                                            style={{ width: 24, height: 24, alignItems: 'center', justifyContent: "center", alignSelf: "center", paddingRight: 0, marginTop: 0, marginRight: 0, borderColor: "black", borderWidth: 2, borderRadius: 30 }}>
                                            <Image source={require('./assets/images/plus.png')} style={{ width: 20, height: 20, borderRadius: 0, borderWidth: 0, borderColor: "white", borderRadius: 0, resizeMode: "cover", flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: "center", alignSelf: "center", transform: [{ scale: 1 }], marginTop: 0 }} />
                                        </TouchableOpacity>
                                    </View>
                                );

                            })}
                        </ScrollView>

                    </View>
                </Animated.View>
            )}

            {isVisibleinfo && (
                <Animated.View style={[feeldialog.dialog, { transform: [{ translateY: translateYinfo }], alignItems: "center", justifyContent: 'center', elevation: 5 }]} >
                    <Text style={{ ...styles.symbol, fontWeight: 700, fontSize: 11, marginTop: 10, marginBottom: 10, textAlign: "center", color: "rgba(0, 0, 0, 1)" }}>Info & Risks</Text>
                    <Text style={{ ...styles.symbol, fontWeight: 500, fontSize: 11, marginTop: 10, marginBottom: 10, textAlign: "center", color: "rgba(0, 0, 0, 1)" }}>All Financial Market Watcher gives you access to all instruments active all over the world. You can view metals, pairs, stocks, crypto all in one place and examine their changes.</Text>
                    <Text style={{ ...styles.symbol, fontWeight: 400, fontSize: 10, marginTop: 10, marginBottom: 10, textAlign: "center", color: "rgba(0, 0, 0, 1)" }}>Risk Disclosure: Trading in financial instruments and/or cryptocurrencies involves high risks, including the risk of losing some or all of your investment amount, and may not be suitable for all investors. Prices of cryptocurrencies are extremely volatile and can be affected by external factors such as financial, regulatory or political events. Trading on margin increases financial risks.
                        Before deciding to trade financial instruments or cryptocurrencies, you should be fully informed about the risks and costs of trading in the financial markets, carefully consider your investment objectives, level of experience and risk appetite, and seek professional advice where necessary.
                        All Financial Market Watcher, we would like to remind you that the data contained in this application may not be real-time or accurate. The data and prices on the app are not necessarily provided by any market or exchange, but may be provided by market makers and therefore the prices may not be accurate and may differ from the actual price on any given market; that is, prices are indicative and not representative. Suitable for trading purposes. All Financial Market Watcher and any provider of the data contained in this Market Watcher application will not accept liability for any loss or damage whatsoever arising from your trading or reliance on the information contained on this website.
                        The use, storage, reproduction, display, modification, transmission or distribution of the data contained in this application is prohibited without the prior express written permission of All Financial Market Watcher and/or the data provider. All intellectual property rights are reserved by the providers and/or exchanges that provide this application and the data contained therein.</Text>

                </Animated.View>
            )}
        </View>
    );


};
const feeldialog = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',

    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    dialog: {
        position: 'absolute',
        bottom: -150,
        left: 10,
        right: 10,
        backgroundColor: 'white',
        padding: 15,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 40,
        padding: 10,
        marginBottom: 10,
    },
    tweetButton: {
        backgroundColor: '#05001c',
        padding: 7,
        paddingLeft: 30,
        paddingRight: 30,
        borderRadius: 40,
        alignSelf: 'center',
        ...Platform.select({
            android: {
                elevation: 7,
            },
            ios: {
                shadowColor: 'black',
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
            },
        }),
    },
    tweetButtonfeelpost: {
        backgroundColor: '#05001c',
        padding: 8,
        paddingLeft: 30,
        paddingRight: 30,
        borderRadius: 40,
        alignSelf: 'center',
        ...Platform.select({
            android: {
                elevation: 4,
            },
            ios: {
                shadowColor: 'black',
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
            },
        }),
    },
    tweetButtonText: {
        color: 'white',
        fontWeight: 'bold',


    },

});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
    },
    dataItem: {
        width: Dimensions.get('window').width - 20, // Ekranın yarısı kadar genişlik (15 piksel boşluk)
        padding: 15,

        marginBottom: 10,
        borderRadius: 25,
        borderWidth: 0,
        borderColor: 'gray',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    dataItem2x: {
        width: Dimensions.get('window').width - 20, // Ekranın yarısı kadar genişlik (15 piksel boşluk)
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 15,
        paddingRight: 15,

        marginBottom: 8,
        borderRadius: 25,
        borderWidth: 0,
        borderColor: 'gray',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    symbol: {
        fontSize: 18,
        fontWeight: 'bold',
        color: "black",
        marginBottom: 0
    },
    price: {
        fontSize: 16,
        color: "black"
    },
    change: {
        fontSize: 16,
        color: 'black',
    },
    input: {
        width: Dimensions.get('window').width - 20,
        height: 40,
        borderColor: 'rgba(0, 0, 0, 0.3)',
        borderWidth: 2,
        paddingHorizontal: 10,
        borderRadius: 15,
        backgroundColor: 'white'
    },
    imageBackground: {
        flex: 0,
        resizeMode: 'cover', // Arka plan resminin boyutlandırma türü
        justifyContent: 'center', // İçerik yatayda ve dikeyde ortalanır
        borderRadius: 20, // Köşeleri yuvarlama
        overflow: 'hidden', // Köşelerin dışına taşan içeriği gizler
        height: 105,
        margin: 10
    },
});

export default PricerScreen;
