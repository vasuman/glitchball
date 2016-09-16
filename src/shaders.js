
var SHADERS = {"entVertex":"precision mediump float;\n\nconst float mixPow = 2.;\nconst vec4 black = vec4(0., 0., 0., 1.0);\n\nuniform vec3 u_offset;\nuniform vec3 u_point;\nuniform float u_coreSize;\nuniform vec4 u_color;\nuniform mat4 u_worldViewProjection;\nuniform vec2 u_boundMin;\nuniform vec2 u_boundMax;\nuniform float u_bulb;\nuniform float u_wireRatio;\n\nattribute vec3 a_position;\n\nvarying vec4 v_color;\n\nvoid main() {\n    float wireRadius = u_coreSize * u_wireRatio;\n    vec4 pos = vec4(a_position + u_offset, 1.0);\n    float dist = abs(length(a_position - (u_point - u_offset)));\n    float influence = 0.0;\n    v_color = black;\n    if (pos.x > u_boundMin.x && pos.y > u_boundMin.y && pos.x < u_boundMax.x && pos.y < u_boundMax.y) {\n        if (dist < u_coreSize) {\n            influence = sqrt(pow(u_coreSize, 2.0) - pow(dist, 2.0)) / u_coreSize;\n        }\n        if (dist < wireRadius) {\n            float frac = dist / wireRadius;\n            influence += 0.1 * (1. - frac);\n            v_color = mix(u_color, black, pow(frac, mixPow));\n        }\n        pos.z += influence * u_coreSize * u_bulb;\n    }\n    gl_Position = u_worldViewProjection * pos;\n}\n","entFragment":"precision mediump float;\n\nvarying vec4 v_color;\n\nvoid main() {\n    gl_FragColor = v_color;\n}\n","arenaVertex":"precision mediump float;\nconst float heightScale = 35.;\n\nattribute vec3 a_position;\n\nuniform mat4 u_worldViewProjection;\n\nvarying float v_darkness;\n\nvoid main() {\n    v_darkness = a_position.z;\n    gl_Position = u_worldViewProjection * vec4(a_position.xy, a_position.z * heightScale, 1.);\n}\n\n","arenaFragment":"precision mediump float;\n\nconst vec4 black = vec4(0., 0., 0., 0.0);\nconst float darkSmooth = 0.65;\n\nuniform vec4 u_color;\n\nvarying float v_darkness;\n\nvoid main() {\n    gl_FragColor = mix(u_color, black, pow(v_darkness, darkSmooth));\n}\n"};