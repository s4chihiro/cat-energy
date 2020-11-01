

let projectFolder = 'dist'
let sourceFolder = 'src'

let fs = require('fs')

let path = {
    build: {
        html: projectFolder + '/',
        css: projectFolder + '/css/',
        js: projectFolder + '/js/',
        img: projectFolder + '/img/',
        fonts: projectFolder + '/fonts/'
    },
    src: {
        html: [sourceFolder + '/*.html', '!' + sourceFolder + '/_*.html'],
        css: sourceFolder + '/scss/style.scss',
        js: sourceFolder + '/js/script.js',
        img: sourceFolder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
        fonts: sourceFolder + '/fonts/*.ttf'
    },
    watch: {
        html: sourceFolder + '/**/*.html',
        css: sourceFolder + '/scss/**/*.scss',
        js: sourceFolder + '/js/**/*.js',
        img: sourceFolder + '/img/**/*.{jpg,png,svg,gif,ico,webp}'
    },
    clean: './' + projectFolder + '/'
}

let { src, dist } = require('gulp')
let gulp = require('gulp')
const { dest } = require('vinyl-fs')
let browsersync = require('browser-sync').create()
let fileinclude = require('gulp-file-include')
let del = require('del')
let scss = require('gulp-sass')
let autoprefixer = require('gulp-autoprefixer')
let groupMedia = require('gulp-group-css-media-queries')
let cleanCss = require('gulp-clean-css')
let rename = require('gulp-rename')
let uglify = require('gulp-uglify-es').default
let babel = require('gulp-babel')
let imagemin = require('gulp-imagemin')
let webp = require('gulp-webp')
let webphtml = require('gulp-webp-html')
let webpcss = require('gulp-webpcss')
let svgSprite = require('gulp-svg-sprite')
let ttf2woff = require('gulp-ttf2woff')
let ttf2woff2 = require('gulp-ttf2woff2')
let fonter = require('gulp-fonter')


function browserSync(params) {
    browsersync.init({
        server: {
            baseDir: './' + projectFolder + '/'
        },
        port: 3000,
        notify: false
    })
}

function html(params) {
    return src(path.src.html)
        .pipe(fileinclude())
        .pipe(webphtml())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream())
}

function css(params) {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: 'expanded'
            })
        )
        .pipe(groupMedia())
        .pipe(
            autoprefixer({
                overrideBrowserslist: ['last 5 versions'],
                cascade: true
            })
        )
        .pipe(webpcss())
        .pipe(dest(path.build.css))
        .pipe(cleanCss())
        .pipe(
            rename({
                extname: '.min.css'
            })
        )
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function js(params) {
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(
            rename({
                extname: '.min.js'
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}

function images(params) {
    return src(path.src.img)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(
            imagemin({
                interlaced: true,
                progressive: true,
                optimizationLevel: 3,
                svgoPlugins: [{
                    removeViewBox: false
                }]
            })
        )
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream())
}

function fonts(params) {
    gulp.src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts));
    return gulp.src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}

gulp.task('otf2ttf', function () {
    return src([sourceFolder + '/fonts/*.otf'])
        .pipe(
            fonter({
                formats: ['ttf']
            })
        )
        .pipe(dest(sourceFolder + '/fonts/'))
})

gulp.task('svgSprite', function () {
    return gulp.src([sourceFolder + '/iconsprite/*.svg'])
        .pipe(
            svgSprite({
                mode: {
                    stack: {
                        sprite: '../icons/icons.svg',
                        example: true
                    }
                }
            })
        )
        .pipe(dest(path.build.img))
})

function fontsStyle(params) {
    let fileContent = fs.readFileSync(sourceFolder + '/scss/fonts.scss');
    if (fileContent == '') {
        fs.writeFile(sourceFolder + '/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let cFontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (cFontname != fontname) {
                        fs.appendFile(sourceFolder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    cFontname = fontname;
                }
            }
        })
    }
}

function cb() {

}

function watchFiles(params) {
    gulp.watch([path.watch.html], html)
    gulp.watch([path.watch.css], css)
    gulp.watch([path.watch.js], js)
    gulp.watch([path.watch.img], images)
}

function clean(params) {
    return del(path.clean)
}


let build = gulp.series(clean, gulp.parallel(css, js, html, images, fonts), fontsStyle)
let watch = gulp.parallel(build, watchFiles, browserSync)

exports.fontsStyle = fontsStyle
exports.fonts = fonts
exports.images = images
exports.css = css
exports.js = js
exports.html = html
exports.build = build
exports.watch = watch
exports.default = watch
