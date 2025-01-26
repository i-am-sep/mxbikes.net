import json
import subprocess
import logging
import os
import requests
import urllib3
from data.download_images import SpysProxyParser, Proxy

# Disable HTTPS verification warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def update_pac_file(working_proxies):
    """
    Update the proxy.pac file with working proxies.
    """
    try:
        pac_content = """function FindProxyForURL(url, host) {
    // List of proxies from working_proxies.json
    var proxies = [
%s
    ];

    // Return the fastest proxy from the list
    for (var i = 0; i < proxies.length; i++) {
        return "PROXY " + proxies[i];
    }

    // Fallback: Direct access (no proxy) if no proxies work
    return "DIRECT";
}"""
        
        # Format proxy list for PAC file
        proxy_list = [f'        "{proxy.ip_port}"' for proxy in working_proxies]
        proxy_string = ',\n'.join(proxy_list)
        
        # Write the PAC file
        pac_path = os.path.join("data", "proxy.pac")
        with open(pac_path, "w") as f:
            f.write(pac_content % proxy_string)
        logger.info(f"Updated PAC file with {len(working_proxies)} proxies")
        
        # Print the full path for easy copying
        full_path = os.path.abspath(pac_path)
        logger.info(f"\nPAC file location (copy this to Windows proxy settings):")
        logger.info(f"file:///{full_path.replace(os.sep, '/')}")
        
    except Exception as e:
        logger.error(f"Failed to update PAC file: {e}")

def test_proxy_connection(proxy):
    """
    Test if a proxy is working by making a request through it.
    """
    try:
        proxies = {
            "http": f"http://{proxy.ip_port}",
            "https": f"http://{proxy.ip_port}"
        }
        response = requests.get("http://httpbin.org/ip", proxies=proxies, timeout=5, verify=False)
        response.raise_for_status()
        ip_data = response.json()
        return ip_data.get("origin", "Unknown")
    except Exception as e:
        logger.error(f"Proxy test failed: {e}")
        return None

def verify_proxy_setup(working_proxies):
    """
    Verify proxy setup by testing direct connection and proxy connection
    """
    logger.info("\nVerifying proxy setup...")
    
    # Test direct connection
    try:
        direct_response = requests.get("http://httpbin.org/ip", timeout=5)
        direct_ip = direct_response.json().get("origin", "Unknown")
        logger.info(f"Your direct IP: {direct_ip}")
    except Exception as e:
        logger.error(f"Failed to get direct IP: {e}")
        return

    # Test fastest proxy
    if working_proxies:
        fastest_proxy = working_proxies[0]
        proxy_ip = test_proxy_connection(fastest_proxy)
        
        if proxy_ip:
            logger.info(f"Fastest proxy IP ({fastest_proxy.ip_port}): {proxy_ip}")
            
            if proxy_ip != direct_ip:
                logger.info("✓ Proxy is working! Your IP address is different when using the proxy.")
            else:
                logger.warning("✗ Proxy might not be working - IP address is the same with and without proxy.")
        else:
            logger.error("✗ Failed to connect through proxy")

def main():
    try:
        # Use default values for testing
        force_new = True  # Always force new test for reliability
        num_threads = 20  # Default recommended value

        # Initialize proxy parser
        parser = SpysProxyParser()
        
        # Fetch and test proxies
        logger.info("Starting proxy fetch and test process...")
        proxies = parser.fetch_proxies()
        
        if not proxies:
            logger.error("No proxies found, exiting.")
            return

        # Test proxies and get working ones
        working_proxies = parser.test_proxies(num_to_test=len(proxies), num_threads=num_threads, force_new=force_new)
        working_proxies = [p for p in working_proxies if p.latency != float('inf')]
        working_proxies.sort(key=lambda x: x.latency)  # Sort by latency

        if not working_proxies:
            logger.error("No working proxies found, exiting.")
            return

        # Update the PAC file with working proxies
        update_pac_file(working_proxies)

        # Verify proxy setup
        verify_proxy_setup(working_proxies)

        # Print setup instructions
        logger.info("\nTo set up the proxy in Windows:")
        logger.info("1. Open Windows Settings")
        logger.info("2. Go to Network & Internet > Proxy")
        logger.info("3. Scroll to 'Automatic proxy setup'")
        logger.info("4. Enable 'Use setup script'")
        logger.info("5. Copy and paste the PAC file location shown above into 'Script address'")
        logger.info("6. Click Save")
        logger.info("\nTo verify it's working:")
        logger.info("1. Open PowerShell and run:")
        logger.info("   Invoke-WebRequest -Uri http://httpbin.org/ip | Select-Object -ExpandProperty Content")
        logger.info("2. The IP should be one of these proxy IPs:")
        for proxy in working_proxies[:3]:
            logger.info(f"   - {proxy.ip_port} (latency: {proxy.latency:.2f}s)")

    except Exception as e:
        logger.error(f"Main process failed: {e}")

if __name__ == "__main__":
    main()
