package com.ecommerce.user_service.constant;

/**
 * Role authority chains. Commerce actors (Amazon-style):
 *
 * <ul>
 *   <li>ROLE_USER — registered customer (and every staff role, as base)</li>
 *   <li>ROLE_CS — customer-service agent: order lookup, returns, concessions</li>
 *   <li>ROLE_MANAGER — merchant ops: catalog + promotions + subscription ops</li>
 *   <li>ROLE_ADMIN — full admin console</li>
 *   <li>ROLE_SUPER_ADMIN — platform owner (user management)</li>
 * </ul>
 *
 * ROLE_HR is a legacy org-chart role kept only so old tokens keep parsing —
 * do not assign it to new accounts.
 */
public class Authority {
    public static final String[] USER_AUTHORITIES = { "ROLE_USER" };
    /** Legacy — kept for old accounts; not assignable in the console. */
    public static final String[] HR_AUTHORITIES = { "ROLE_USER", "ROLE_HR" };
    public static final String[] CS_AUTHORITIES = { "ROLE_USER", "ROLE_CS" };
    public static final String[] MANAGER_AUTHORITIES = { "ROLE_USER", "ROLE_CS", "ROLE_MANAGER" };
    public static final String[] ADMIN_AUTHORITIES = { "ROLE_USER", "ROLE_CS", "ROLE_MANAGER", "ROLE_ADMIN" };
    public static final String[] SUPER_ADMIN_AUTHORITIES = { "ROLE_USER", "ROLE_CS", "ROLE_MANAGER", "ROLE_ADMIN", "ROLE_SUPER_ADMIN" };
}
