var gulp = require('gulp');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
gulp.task('lint',function(){
    gulp.src('./js/*.js')
    //检查js文件夹下的js文件是否有报错或者警告
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});
/*gulp.task('sass', function() {
    gulp.src('./scss/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('./css'));
});
* 编译scss下的css文件保存到css文件夹目录下
*/

gulp.task('scripts',function(){
    gulp.src('./js/*.js')
        .pipe(concat('all.js'))
        .pipe(gulp.dest('./dist'))
        .pipe(rename('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist'));
});
gulp.task('default',function(){
    gulp.run('lint','scripts');
    gulp.watch('./js/*.js',function(){
        gulp.run('lint','scripts');
    });
});