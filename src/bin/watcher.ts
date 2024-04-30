#!/usr/bin/env -S node
import { entry_point } from '../lib/logic.js';

/**
 * <u>entry point of the server CLI</u>.
 *
 * the actual executable file.
 */
await entry_point().catch( console.error );
