function FindProxyForURL(url, host) {
    // List of proxies from working_proxies.json
    var proxies = [
        "154.16.146.43:80",
        "130.61.111.246:6379",
        "79.110.202.184:8081",
        "212.127.95.235:8081",
        "114.35.140.157:8080",
        "61.239.128.81:8080",
        "103.49.114.5:8080",
        "187.190.127.212:8081",
        "1.237.239.168:80",
        "31.47.58.37:80"
    ];

    // Return the fastest proxy from the list
    for (var i = 0; i < proxies.length; i++) {
        return "PROXY " + proxies[i];
    }

    // Fallback: Direct access (no proxy) if no proxies work
    return "DIRECT";
}