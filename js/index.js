let loadingRender = (function () {
    let $loadingBox = $('.loadingBox');
    let $current = $loadingBox.find('.current');
    let imgData = [
        "img/1.jpg",
        "img/2.jpg",
        "img/3.jpg",
        "img/4.jpg",
        "img/5.jpg",
    ];
    //预加载图片
    let n=0;//记录当前加载多少
    let len = imgData.length;//一共有多少图片
    let run = function run(callback) {

        imgData.forEach(item=>{
            let tempImg = new Image;
            tempImg.onload = ()=>{
                tempImg = null;
                $current.css('width',((++n) / len)*100+'%')

                //判断加载完成,执行回调函数（让当前loading页面消失）
                if(n===len){
                    clearTimeout(delayTimer);//如果在10s内加载完成了，就没必要执行这个定时器了。
                    callback && callback()
                }
            }
            tempImg.src = item;
        })
    }
    //设置最长等待时间（假设10s，到达10s我们看加载了多少如果已经达到了90%以上，我们可以正常访问内容了，如果不足这个比例，直接提示用户当前网络不佳，稍后重试）
    let delayTimer = null;
    let maxDelay = function maxDelay(callback){
        delayTimer = setTimeout(()=>{
            if(n/len>=0.9){
                $current.css('width','100%');
                callback &&callback();
                return;
            }
            alert('当前网络不佳，请稍后再试')
            window.location.href='http://www.qq.com'//此时我们不应该继续加载图片，而是让其关掉页面或者跳转到其他页面
        },10000)
    };

    //完成
    let done = function done() {
        //停留一秒钟在移除进入下一环节
        let timer= setTimeout(()=>{
            $loadingBox.remove();//1秒后（停留一会让用户看清楚进度条加载完成）把loadingBox移除
            phoneRender.init();
        },1000)

    }
    return{
        init:function () {
            $loadingBox.css('display','block')
            run(done);
            maxDelay(done);
        }
    }
})();

/*phone*/
let phoneRender=(function () {
    let $phoneBox = $('.phoneBox');
    let $time = $phoneBox.find('h2>span');
    let $answer = $phoneBox.find('.answer');
    let $answerMarkLink = $answer.find('.markLink');
    let $hang = $phoneBox.find('.hang');
    let $hangMarkLink = $hang.find('.markLink');
    let answerBell = $('#answerBell')[0]//加上[0]把获取的对象转换成原生js对象
    let introduction = $('#introduction')[0];
    let answerMarkTouch = function answerMarkTouch() {
        //删除answer
        $answer.remove();
        answerBell.pause();//关闭音乐
        $(answerBell).remove();//$(answerBell) 把answerBell转换为jq对象，删除音频
        //显示hang
        $hang.css('transform','translateY(0rem)');
        $time.css('display','block')
        introduction.play()//自我介绍的音乐播放

        computedTime()

    }
    //计算播放时间
    let autoTimer = null;
    let computedTime = function computedTime() {
        /*
        let duration = 0;
        //我们让audio播放，首先回去加载资源，部分资源加载完成才会播放，才会计算出总时间duration等信息，所以我们可以把获取信息放到oncanplay（可以播放了，有声音了）事件中。
        introduction.oncanplay = function(){
            duration = introduction.duration//获取自我介绍音频的总时间
        }
        */
        autoTimer = setInterval(()=>{
            let val = introduction.currentTime;//获取介绍的播放秒(当前播放时间)
            let duration = introduction.duration
            if(val>=duration){//播放完成，清除setInterval
                alert('111')
                clearInterval(autoTimer);
                closePhone();
                return
            }
            let minute = Math.floor(val/60);//   val/60 得到分钟， Math.floor向下取整
            let second = Math.floor(val - minute*60) //总秒数-转换的分钟所占的秒数=剩下的秒数
            minute = minute<10?'0'+minute:minute;//9以下补0
            second = second<10?'0'+second:second;//9以下补0
            $time.html(`${minute}:${second}`)
        },1000)

    };
    //关闭phone
    let closePhone = function closePhone() {
        clearInterval(autoTimer)
        introduction.pause();//自我介绍音频暂停
        $('introduction').remove();
        $phoneBox.remove();

        messageRender.init();

    };
    return{
        init:function () {
            $phoneBox.css('display','block')
            answerBell.play();//播放bell
            answerBell.volume = 0.5;//调整声音，比正常声音小一半
            //点击answerMark
            $answerMarkLink.tap(answerMarkTouch)
            $hangMarkLink.tap(closePhone)
            //$answerMarkLink.on('click',answerMarkTouch);
            //closePhone$hangMarkLink.on('click',closePhone)

        }
    }
})();

/*message*/
let messageRender = (function(){
    let $messageBox = $('.messageBox');
    let $wrapper = $('.wrapper');
    let $messageList = $wrapper.find('li');
    let $keyBoard = $messageBox.find('.keyBoard');
    let $textInp = $keyBoard.find('span');
    let $submit = $keyBoard.find('.submit');
    let step = -1;//记录当前展示信息的索引
    let total = $messageList.length+1;//记录的信息总条数（+1是因为自己发一条所以加1）。
    let autoTimer = null;
    let interval = 2000;//记录多久发一条
    let demonMusic = $('#demonMusic')[0];

    //展示信息
    let tt = 0;
    let showMessage = function showMessage() {
        ++step;
        if(step===2){
            //已经展示两条了，此时我们结束自动发布信息，让键盘出来，开始走手动发送。
            handleSend();
            clearInterval(autoTimer);
            return;
        }

        let $cur = $messageList.eq(step);
        // eq:得到的是元素jq对象；get得到的是js对象;
        $cur.addClass('active');

        if(step>=3){//展示的条数已经是4条或4条以上了，此时我们让wrapper向上移动（移动的距离是新展示这一条的高度）
            //消息列表自动滚动，方案1
            /*let curH = $cur[0].offsetHeight;//新展示那条的高度（第4条）
            let wraT= parseFloat($wrapper.css('top'));//parseFloat将px去掉
            $wrapper.css('top',wraT-curH)*/

            //js中基于css获取transform，得到的结果是一个矩阵   let wraT = $wrapper.css('transform')
            //消息列表自动滚动，方案2
            let curH = $cur[0].offsetHeight;//新展示那条的高度（第4条）
            tt-=curH;
            $wrapper.css('transform',`translateY(${tt}px)`);
        }
        if(step>=total - 1){//展示完了
            clearInterval(autoTimer);
            closeMessage();
        }


    }
    //手动发送
    let handleSend = function handleSend() {
        //如何知道它走没走完？由于它设置了transition效果，监听动画事件，transitionend事件
        $keyBoard.css('transform','translateY(0rem)').one('transitionend',()=>{
            //transtionend监听当前元素transtion动画结束的事件(并且有几个样式属性改变，并且执行了过渡效果，事件就会触发几次)
            let str = '好的，马上介绍！';
            let n=-1;
            let textTimer = null;
            textTimer = setInterval(()=>{
                let orginHTML = $textInp.html();//获取html
                $textInp.html(orginHTML+str[++n]);
                if(n>=str.length-1){//文字显示完成
                    clearInterval(textTimer);
                    $submit.css('display','block')
                }
            },100)
        })

    };
    //点击发送按钮submit
    let handleSubmit = function handleSubmit() {
        //把新创建的li，插入到第二个li后面，
        $(`<li class="self"><!--自己说的-->
                <i class="arrow"></i>
                <img class="pic" src="img/zf_messageStudent.png" alt="">
                ${$textInp.html()}
            </li>`).insertAfter($messageList.eq(1)).addClass('active');
        $messageList = $wrapper.find('li');//重要：把新的li放到页面中，我们此时应该重新获取li，让messageList和页面中的li正对应，方便后期根据索引展示对应的li

        //该消失的消失
        $textInp.html('');
        $submit.css('display','none');
        $keyBoard.css('transform','translateY(3.7rem)');

        //继续向下展示剩余的消息
        autoTimer = setInterval(showMessage,interval);

    };
    //关闭message区域
    let closeMessage = function closeMessage() {

        let delayTimer = setTimeout(()=>{
            demonMusic.pause();
            $(demonMusic).remove();
            $messageBox.remove();
            clearTimeout(delayTimer)
            cubeRender.init();
        },2000)
    }
    return{
        init:function () {
            $messageBox.css('display','block')
            showMessage();//刚开始进来显示一条，然后在每间隔interval秒后在展示
            autoTimer = setInterval(showMessage,interval);
            $submit.tap(handleSubmit);

            //music
            demonMusic.play();
            demonMusic.volume = 0.3;//音乐声音
        }
    }

})();

/*cube 魔方区域*/
let cubeRender = (function () {
    let $cubeBox = $(".cubeBox");
    let $cube = $('.cube');
    let $cubeList = $cube.find('li');

    //手指控制旋转
    let start = function start(ev) {
        //this:原生js对象，ul
        //记录手指按下位置的起始坐标
        let point = ev.changedTouches[0];
        this.strX = point.clientX;//自定义属性，记录手指按下的位置
        this.strY = point.clientY;
        this.changeX = 0;//自定义属性
        this.changeY = 0;//自定义属性

    };

    //手指移动
    let move =function move(ev) {
        //用最新手指的位置-起始的位置，记录x/y轴的偏移
        let point = ev.changedTouches[0];
        this.changeX = point.clientX-this.strX;
        this.changeY = point.clientY-this.strY;
    };
    //手指离开
    let end =function end(ev) {
        //获取change、rotate值
        let {changeX,changeY,rotateX,rotateY} = this;//解构赋值
        let isMove = false;

        //验证是否发生移动(判读滑动误差)
        // 向左滑动-值；向右滑动+值 向上滑-值；向下滑+值
        Math.abs(changeX)>10||Math.abs(changeY)>10?isMove=true:null;
        //只有发生移动在处理
        if(isMove){
            //1.左右滑动changeX，操作的rotateY（正比change越大rotate越大）
            //2.上下滑动changeY，操作的rotateX（反比change越大rotate越小）
            //3.为了让每一次操作旋转角度小一点，我们可以把移动距离的1/3作为旋转角度即可
            rotateX= rotateX - changeY/3;
            rotateY= rotateY + changeX/3;

            //赋值给魔方盒子
            $(this).css('transform',`scale(0.6) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`)
            //让当前旋转的角度成为下一次起始的角度
            this.rotateX = rotateX;
            this.rotateY = rotateY;

            //清空其他记录的属性值
            ['strX','strY','changeX','changeY'].forEach(item=>this[item]=null)
        }
    };
    return{
        init:function () {
            $cubeBox.css('display',"block");

            //手指操作cube，让cube跟着旋转
            let cube = $cube[0];//$cube[0]：jq对象转为js对象
            cube.rotateX = -35;//记录初始的旋转角度，存储到自定义属性上；
            cube.rotateY = -35;

            $cube.on('touchstart',start)
                .on('touchmove',move)
                .on('touchend',end)
            //点击每一个面跳转到详情区域对应的页面
            $cubeList.tap(function () {
                $cubeBox.css('display','none');
                //跳转到详情区域，通过传递点击li的索引，让其定位到具体的slide
                let index = $(this).index();
                detainRender.init(index)
            })
        }
    }
})();
/*detail swiper*/
detainRender = (function () {
    let $detailBox = $('.detailBox');
    let swiper = null;
    let $dl = $('.page1>dl');
    let swiperInit = function swiperInit() {
        swiper = new Swiper('.swiper-container',{
            //intialSlide:1//初始slide索引
            //direction:horizontal//可设置水平(horizontal)或垂直(vertical)
            //loop:true//swiper有一个bug：3d切换设置loop为true的时候偶尔会出现无法切换的情况(2d效果没有问题)
            //无缝切换原理：把真实第一张克隆一份放到末尾，把真实最后一张也克隆一份放到开始（真实图片有5张，wrapper中会有7个slide）
            //onInit:(swiper)=>{},//初始化成功执行，（参数是当前初始化的实例）
            //onTouchEnd:()=>{}//手指离开区域
            //onTransitionEnd:(swiper)=>{}//切换动画完成执行的回调函数

            //实例的私有属性
            //1.activeIndex：当前展示slide块的索引
            //2.slides：获取所有的slide（数组）
            //实例的公有方法
            //1.lideTo:切换到指定索引的slide
            effect:'coverflow',//切换效果
            onInit:move,
            onTransitionEnd:move

        })
    };
    let move = function move(swiper) {
        //swiper:是当前创建的实例
        //1.判断当前是否为第一个slide：如果是让3d菜单展开，不是收起
        let activeIn = swiper.activeIndex;
        let slideAry = swiper.slides;
        if(activeIn===0){//page1
            //实现折叠效果
            $dl.makisu({
                selector:'dd',
                overlap:0.6,
                speed:0.8
            });
            $dl.makisu('open');
        }else{
            //其他配置页面
            $dl.makisu({
                selector:'dd',
                speed:0
            });
            $dl.makisu('close');

        }
        //2.滑动到哪一个页面，把当前页面设置对应的id，其余页面移除id
        slideAry.forEach((item,index)=>{
            if(activeIn===index){
                item.id=`page${index+1}`;
                return
            }
            item.id=null
        })
    }


    return{
        init:function (index=0) {
            $detailBox.css('display','block');

            if(!swiper){//防止重复初始化
                swiperInit();
            }

            swiper.slideTo(index,0);//直接运动到具体的slide页面(第二个参数是切换速度，0是立即切换没有切换动画效果)
        }
    }
})();
/*以后在真实的项目中，如果页面中有滑动的需求，我们一定要把document本身滑动的默认行为阻止掉（不阻止：浏览器中预览，会触发下拉刷新或者左右滑动切换页卡等功能）*/
$(document).on('touchstart touchmove touchend',(ev)=>{
    ev.preventDefault();
})

//开发过程中，由于当前项目版块众多（每一个版块都是一个单例），我们最好规划一种机制：通过标识的判断可以让程序只执行对应版块内容，这样开发哪个版块，我们就把标识改为啥（hash路由控制）

let url = window.location.href;//获取当前页面的url地址
let well = url.indexOf('#');
console.log(well);
let hash = well===-1?null:url.substr(well+1);
switch (hash) {
    case 'loading':
        loadingRender.init();
        break;
    case 'phone':
        phoneRender.init();
        break;
    case 'message':
        messageRender.init();
        break;
    case 'cube':
        cubeRender.init();
        break;
    case 'detail':
        detainRender.init();
        break;
    default:
        loadingRender.init();

}

