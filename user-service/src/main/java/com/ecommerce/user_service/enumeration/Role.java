package com.ecommerce.user_service.enumeration;

import static com.ecommerce.user_service.constant.Authority.*;

/**
 * Assignable account roles. ORDER MATTERS for the "next role up" logic in the
 * admin user list (USER -&gt; CS -&gt; MANAGER -&gt; ADMIN -&gt; SUPER_ADMIN).
 */
public enum Role {
    ROLE_USER(USER_AUTHORITIES),
    /** Legacy org-chart role — kept so old tokens parse; do not assign. */
    ROLE_HR(HR_AUTHORITIES),
    /** Customer-service agent (Amazon CS tools: order lookup, refunds, returns). */
    ROLE_CS(CS_AUTHORITIES),
    ROLE_MANAGER(MANAGER_AUTHORITIES),
    ROLE_ADMIN(ADMIN_AUTHORITIES),
    ROLE_SUPER_ADMIN(SUPER_ADMIN_AUTHORITIES);

    private String[] authorities;

    Role(String... authorities) {
        this.authorities = authorities;
    }

    public String[] getAuthorities() {
        return authorities;
    }
}
