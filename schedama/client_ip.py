import ipaddress


def get_client_ip(request):
    """
    This function retrieves the real client IP address with the sole purpose of rate limiting logics, otherwise the
    IP used in the rate limiting is the internal Render proxy.

    Real client IP on Render (client -> Cloudflare -> Render proxy -> gunicorn).

    REMOTE_ADDR is the internal Render proxy (the same for many users), so we
    read CF-Connecting-IP, which Cloudflare always overwrites with the address
    that actually connected to it. X-Forwarded-For is NOT used on purpose:
    Render appends to it, so the first value can be forged by the client.
    Falls back to REMOTE_ADDR in local development (no Cloudflare).
    """
    value = request.META.get("HTTP_CF_CONNECTING_IP", "").strip()
    if value:
        try:
            return str(ipaddress.ip_address(value))
        except ValueError:
            pass
    return request.META.get("REMOTE_ADDR", "")
