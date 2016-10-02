
var SHADERS = {"entVertex":"precision mediump float;\n\nconst float goalFactor = 2.;\nconst float mixPow = 2.;\nconst vec4 black = vec4(0., 0., 0., 1.0);\nconst vec4 yellow = vec4(0., 0., 1., 1.0);\n\nuniform vec3 u_offset;\nuniform vec3 u_point;\nuniform float u_coreSize;\nuniform vec4 u_color;\nuniform mat4 u_worldViewProjection;\nuniform vec2 u_boundMin;\nuniform vec2 u_boundMax;\nuniform float u_bulb;\nuniform float u_wireRatio;\nuniform float u_goalSize;\n\nattribute vec3 a_position;\n\nvarying vec4 v_color;\n\nvoid main() {\n    float wireRadius = u_coreSize * u_wireRatio;\n    float halfX = (u_boundMin.x + u_boundMax.x) / 2.;\n    float halfY = (u_boundMin.y + u_boundMax.y) / 2.;\n    vec4 pos = vec4(a_position + u_offset, 1.0);\n    float dist = abs(length(a_position - (u_point - u_offset)));\n    float influence = 0.0;\n    v_color = black;\n    if (pos.x > u_boundMin.x && pos.y > u_boundMin.y && pos.x < u_boundMax.x && pos.y < u_boundMax.y) {\n        if (dist < u_coreSize) {\n            influence = sqrt(pow(u_coreSize, 2.0) - pow(dist, 2.0)) / u_coreSize;\n        }\n        if (dist < wireRadius) {\n            float frac = dist / wireRadius;\n            influence += 0.1 * (1. - frac);\n            vec4 color = u_color;\n            float mirX = (pos.x > halfX) ? u_boundMax.x - pos.x : pos.x;\n            float mirY = (pos.y > halfY) ?  pos.y - halfY : halfY - pos.y;\n            if (mirX <= u_goalSize && mirY <= u_goalSize) {\n                color = mix(color, yellow, 0.5);\n                influence *= goalFactor * pow(max(mirX, mirY) / u_goalSize, 2.);\n            }\n            v_color = mix(color, black, pow(frac, mixPow));\n        }\n        pos.z += influence * u_coreSize * u_bulb;\n    }\n    gl_Position = u_worldViewProjection * pos;\n}\n","entFragment":"precision mediump float;\n\nvarying vec4 v_color;\n\nvoid main() {\n    gl_FragColor = v_color;\n}\n","arenaVertex":"precision mediump float;\n\nattribute vec3 a_position;\n\nuniform mat4 u_worldViewProjection;\n\nvarying float v_height;\n\nvoid main() {\n    v_height = a_position.z;\n    gl_Position = u_worldViewProjection * vec4(a_position.xyz, 1.);\n}\n\n","arenaFragment":"precision mediump float;\n\nconst vec4 white = vec4(1., 1., 1., 1.0);\nuniform vec4 u_color;\n\nvarying float v_height;\n\nvoid main() {\n    gl_FragColor = mix(u_color, white, v_height);\n}\n"};